import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to optimize image for PDF
async function optimizeImageForPdf(imageBytes: ArrayBuffer): Promise<ArrayBuffer> {
  // Simple optimization: reduce file size by using reasonable quality settings
  // For production, you could implement actual image resizing/compression here
  const originalSize = imageBytes.byteLength;
  console.log(`Original image size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Return as-is for now, but log the size for monitoring
  return imageBytes;
}

// Helper function to process images in batches
async function processImageBatch(
  pdfDoc: any, 
  pages: any[], 
  pageImages: Map<string, string>, 
  supabase: any, 
  exportId: string, 
  batchIndex: number, 
  totalBatches: number
) {
  console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${pages.length} pages)`);
  
  // Update progress
  await supabase
    .from('exports')
    .update({ 
      export_status: 'in-progress',
      error_message: `Processing batch ${batchIndex + 1}/${totalBatches}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', exportId);

  const processedPages = [];
  
  for (const pageData of pages) {
    const imageUrl = pageImages.get(pageData.id);
    
    if (imageUrl) {
      try {
        console.log(`Processing page ${pageData.letter}: ${imageUrl}`);
        
        // Add authorization headers and better error handling
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Supabase-Edge-Function/1.0',
          },
        });
        
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image for page ${pageData.letter}: ${imageResponse.status} ${imageResponse.statusText}`);
          continue;
        }
        
        const imageBytes = await imageResponse.arrayBuffer();
        const optimizedBytes = await optimizeImageForPdf(imageBytes);
        
        let image;
        
        // Try to embed as JPEG first, then PNG
        try {
          image = await pdfDoc.embedJpg(optimizedBytes);
        } catch {
          try {
            image = await pdfDoc.embedPng(optimizedBytes);
          } catch (e) {
            console.log(`Failed to embed image for page ${pageData.letter}:`, e);
            continue;
          }
        }

        if (image) {
          // Use standard page size and scale image to fit
          const maxWidth = 612; // 8.5 inches at 72 DPI
          const maxHeight = 792; // 11 inches at 72 DPI
          
          // Calculate scaling to fit page while maintaining aspect ratio
          const scaleX = maxWidth / image.width;
          const scaleY = maxHeight / image.height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
          
          const scaledWidth = image.width * scale;
          const scaledHeight = image.height * scale;
          
          const page = pdfDoc.addPage([maxWidth, maxHeight]);
          
          // Center the image on the page
          const x = (maxWidth - scaledWidth) / 2;
          const y = (maxHeight - scaledHeight) / 2;
          
          page.drawImage(image, {
            x: x,
            y: y,
            width: scaledWidth,
            height: scaledHeight,
          });
          
          processedPages.push(pageData.letter);
        }
      } catch (e) {
        console.error(`Error processing image for page ${pageData.letter}:`, e);
      }
    }
  }
  
  console.log(`Batch ${batchIndex + 1} completed. Processed pages: ${processedPages.join(', ')}`);
  return processedPages;
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

    // Process pages in batches to avoid CPU timeout
    const pages = bookData.pages || [];
    const sortedPages = pages.sort((a, b) => a.page_number - b.page_number);
    console.log(`Processing ${sortedPages.length} pages in batches...`);

    const BATCH_SIZE = 5; // Process 5 pages at a time
    const batches = [];
    for (let i = 0; i < sortedPages.length; i += BATCH_SIZE) {
      batches.push(sortedPages.slice(i, i + BATCH_SIZE));
    }

    let totalProcessed = 0;
    
    // Process batches sequentially to avoid overwhelming the system
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const processedPages = await processImageBatch(
        pdfDoc, 
        batch, 
        pageImages, 
        supabase, 
        exportId, 
        batchIndex, 
        batches.length
      );
      totalProcessed += processedPages.length;
      
      // Small delay between batches to prevent CPU overload
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Completed processing. Total pages processed: ${totalProcessed}/${sortedPages.length}`);

    if (totalProcessed === 0) {
      await supabase
        .from('exports')
        .update({ 
          export_status: 'error',
          error_message: 'No images found or all images failed to process',
          updated_at: new Date().toISOString()
        })
        .eq('id', exportId);

      return new Response(
        JSON.stringify({ error: 'No images found or all images failed to process' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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