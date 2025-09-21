import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Background PDF generation function
async function generatePdfInBackground(exportId: string, supabase: any, exportRecord: any, bookData: any, pageImages: Map<string, string>) {
  try {
    console.log('Starting background PDF generation for export:', exportId);
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const pages = bookData.pages || [];
    const sortedPages = pages.sort((a, b) => a.page_number - b.page_number);
    
    console.log(`Processing ${sortedPages.length} pages...`);
    let successCount = 0;
    
    for (const pageData of sortedPages) {
      const imageUrl = pageImages.get(pageData.id);
      
      if (imageUrl) {
        try {
          console.log(`Processing page ${pageData.letter}: ${imageUrl}`);
          
          const imageResponse = await fetch(imageUrl, {
            headers: { 'User-Agent': 'Supabase-Edge-Function/1.0' },
          });
          
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image for page ${pageData.letter}: ${imageResponse.status}`);
            continue;
          }
          
          const imageBytes = await imageResponse.arrayBuffer();
          console.log(`Image size for page ${pageData.letter}: ${(imageBytes.byteLength / 1024 / 1024).toFixed(2)} MB`);
          
          let image;
          try {
            image = await pdfDoc.embedJpg(imageBytes);
          } catch {
            try {
              image = await pdfDoc.embedPng(imageBytes);
            } catch (e) {
              console.log(`Failed to embed image for page ${pageData.letter}:`, e);
              continue;
            }
          }

          if (image) {
            // Use standard letter size and scale image to fit
            const pageWidth = 612; // 8.5 inches at 72 DPI
            const pageHeight = 792; // 11 inches at 72 DPI
            
            const scaleX = pageWidth / image.width;
            const scaleY = pageHeight / image.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
            
            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;
            
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            
            // Center the image
            const x = (pageWidth - scaledWidth) / 2;
            const y = (pageHeight - scaledHeight) / 2;
            
            page.drawImage(image, {
              x: x,
              y: y,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            successCount++;
            
            // Update progress every few pages
            if (successCount % 3 === 0) {
              await supabase
                .from('exports')
                .update({ 
                  error_message: `Processed ${successCount}/${sortedPages.length} pages`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', exportId);
            }
          }
        } catch (e) {
          console.error(`Error processing page ${pageData.letter}:`, e);
        }
      }
    }

    if (successCount === 0) {
      throw new Error('No images could be processed');
    }

    console.log(`Saving PDF with ${successCount} pages...`);
    const pdfBytes = await pdfDoc.save();
    
    const fileName = `${exportRecord.user_id}/${exportRecord.content_id}/book-${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    await supabase
      .from('exports')
      .update({ 
        export_status: 'complete',
        export_url: publicUrlData.publicUrl,
        file_size_bytes: pdfBytes.length,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: null
      })
      .eq('id', exportId);

    console.log(`PDF generation completed successfully. File size: ${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('Background PDF generation failed:', error);
    
    await supabase
      .from('exports')
      .update({ 
        export_status: 'error',
        error_message: error.message || 'PDF generation failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exportId } = await req.json();
    console.log('Starting PDF generation for export:', exportId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get export record and verify ownership
    const { data: exportRecord, error: exportError } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (exportError || !exportRecord) {
      console.error('Export not found:', exportError);
      return new Response(
        JSON.stringify({ error: 'Export not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to in-progress immediately
    await supabase
      .from('exports')
      .update({ 
        export_status: 'in-progress',
        error_message: 'Starting PDF generation...',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId);

    // Fetch book data
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select(`
        id, book_name, book_description, category,
        pages (
          id, letter, title, page_number, content
        )
      `)
      .eq('id', exportRecord.content_id)
      .eq('user_id', exportRecord.user_id)
      .single();

    if (bookError || !bookData) {
      console.error('Error fetching book data:', bookError);
      await supabase
        .from('exports')
        .update({ 
          export_status: 'error',
          error_message: 'Failed to fetch book data',
          updated_at: new Date().toISOString()
        })
        .eq('id', exportId);

      return new Response(
        JSON.stringify({ error: 'Failed to fetch book data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch images
    let pageImages = new Map();
    if (bookData.pages && bookData.pages.length > 0) {
      const pageIds = bookData.pages.map(p => p.id);
      const { data: imagesData } = await supabase
        .from('page_image_urls')
        .select('page_id, image_url')
        .in('page_id', pageIds)
        .eq('is_latest', true)
        .eq('generation_status', 'complete');

      if (imagesData) {
        imagesData.forEach(img => {
          pageImages.set(img.page_id, img.image_url);
        });
      }
    }

    // Start background processing - this continues after response is sent
    EdgeRuntime.waitUntil(generatePdfInBackground(exportId, supabase, exportRecord, bookData, pageImages));

    // Return immediately
    return new Response(JSON.stringify({ 
      success: true,
      message: 'PDF generation started in background'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error starting PDF generation:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});