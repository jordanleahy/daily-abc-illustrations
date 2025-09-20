import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Update status to in-progress
    await supabase
      .from('exports')
      .update({ 
        export_status: 'in-progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId);

    console.log('Fetching book data for:', exportRecord.content_id);

    // Fetch book data with pages and images
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

    // Fetch images for all pages separately
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

    console.log('Creating PDF document...');

    // Create PDF document
    const pdfDoc = await PDFDocument.create();

    // Add pages with images only - no title page, no headers
    const pages = bookData.pages || [];
    console.log(`Processing ${pages.length} pages...`);

    for (const pageData of pages.sort((a, b) => a.page_number - b.page_number)) {
      const imageUrl = pageImages.get(pageData.id);
      
      if (imageUrl) {
        try {
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBytes = await imageResponse.arrayBuffer();
            let image;
            
            // Try to embed as JPEG first, then PNG
            try {
              image = await pdfDoc.embedJpg(imageBytes);
            } catch {
              try {
                image = await pdfDoc.embedPng(imageBytes);
              } catch (e) {
                console.log('Failed to embed image:', e);
                continue; // Skip this page if image can't be processed
              }
            }

            if (image) {
              // Create page sized to fit the image perfectly
              const pageWidth = Math.max(image.width, 612); // Minimum letter width
              const pageHeight = Math.max(image.height, 792); // Minimum letter height
              
              const page = pdfDoc.addPage([pageWidth, pageHeight]);
              
              // Center the image on the page at full size
              const x = (pageWidth - image.width) / 2;
              const y = (pageHeight - image.height) / 2;
              
              page.drawImage(image, {
                x: x,
                y: y,
                width: image.width,
                height: image.height,
              });
            }
          }
        } catch (e) {
          console.log('Error processing image for page:', pageData.letter, e);
          // Skip pages with image processing errors
        }
      }
      // Skip pages without images entirely - no placeholder pages
    }

    console.log('Saving PDF...');

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    const fileName = `${exportRecord.user_id}/${exportRecord.content_id}/book-${Date.now()}.pdf`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      await supabase
        .from('exports')
        .update({ 
          export_status: 'error',
          error_message: 'Failed to upload PDF',
          updated_at: new Date().toISOString()
        })
        .eq('id', exportId);

      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('exports')
      .getPublicUrl(fileName);

    // Update export record with completion
    await supabase
      .from('exports')
      .update({ 
        export_status: 'complete',
        export_url: publicUrlData.publicUrl,
        file_size_bytes: pdfBytes.length,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId);

    console.log('PDF generation completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      exportUrl: publicUrlData.publicUrl,
      fileSize: pdfBytes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    
    // Try to update export status to error if we have the exportId
    try {
      const { exportId } = await req.json();
      if (exportId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!, 
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        await supabase
          .from('exports')
          .update({ 
            export_status: 'error',
            error_message: error.message || 'Unknown error occurred',
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId);
      }
    } catch (updateError) {
      console.error('Failed to update export status:', updateError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});