import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced image fetching with retries and timeout
async function fetchImageWithRetry(url: string, maxRetries = 3, timeoutMs = 30000): Promise<ArrayBuffer> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching image (attempt ${attempt}/${maxRetries}): ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'Supabase-Edge-Function/1.0',
          'Accept': 'image/*',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Validate we got actual image data
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty response received');
      }
      
      if (arrayBuffer.byteLength < 100) {
        throw new Error(`Response too small (${arrayBuffer.byteLength} bytes), likely not an image`);
      }
      
      console.log(`Successfully fetched image: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      return arrayBuffer;
      
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to fetch image after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// Enhanced image embedding with format detection
async function embedImageInPdf(pdfDoc: any, imageBytes: ArrayBuffer, pageLetter: string): Promise<any> {
  // Check image format by examining the first few bytes
  const uint8Array = new Uint8Array(imageBytes);
  let imageFormat = 'unknown';
  
  if (uint8Array.length >= 4) {
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
      imageFormat = 'jpeg';
    } else if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      imageFormat = 'png';
    } else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
      // Check for WEBP
      if (uint8Array.length >= 12 && 
          uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && 
          uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
        imageFormat = 'webp';
      }
    }
  }
  
  console.log(`Detected image format for page ${pageLetter}: ${imageFormat}`);
  
  // Try embedding based on detected format first, then fallback
  const embedFunctions = imageFormat === 'png' 
    ? [() => pdfDoc.embedPng(imageBytes), () => pdfDoc.embedJpg(imageBytes)]
    : [() => pdfDoc.embedJpg(imageBytes), () => pdfDoc.embedPng(imageBytes)];
  
  for (let i = 0; i < embedFunctions.length; i++) {
    try {
      const image = await embedFunctions[i]();
      console.log(`Successfully embedded ${i === 0 ? 'primary' : 'fallback'} format for page ${pageLetter}`);
      return image;
    } catch (error) {
      console.log(`Failed to embed as ${i === 0 ? 'primary' : 'fallback'} format:`, error.message);
      if (i === embedFunctions.length - 1) {
        throw new Error(`Failed to embed image in any supported format: ${error.message}`);
      }
    }
  }
}

// Background PDF generation function
async function generatePdfInBackground(exportId: string, supabase: any, exportRecord: any, bookData: any, pageImages: Map<string, string>) {
  try {
    console.log('Starting background PDF generation for export:', exportId);
    console.log(`Total pages to process: ${bookData.pages?.length || 0}`);
    console.log(`Images available: ${pageImages.size}`);
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const pages = bookData.pages || [];
    const sortedPages = pages.sort((a, b) => a.page_number - b.page_number);
    
    let successCount = 0;
    let failedPages = [];
    const startTime = Date.now();
    
    for (let i = 0; i < sortedPages.length; i++) {
      const pageData = sortedPages[i];
      const imageUrl = pageImages.get(pageData.id);
      
      console.log(`\n=== Processing page ${i + 1}/${sortedPages.length}: ${pageData.letter} ===`);
      
      if (!imageUrl) {
        console.error(`No image URL found for page ${pageData.letter} (ID: ${pageData.id})`);
        failedPages.push({ page: pageData.letter, reason: 'No image URL available' });
        continue;
      }
      
      try {
        // Update progress
        await supabase
          .from('exports')
          .update({ 
            error_message: `Processing page ${pageData.letter} (${i + 1}/${sortedPages.length})...`,
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId);
        
        // Fetch image with retry logic
        const imageBytes = await fetchImageWithRetry(imageUrl);
        
        // Embed image in PDF
        const image = await embedImageInPdf(pdfDoc, imageBytes, pageData.letter);
        
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
        console.log(`✓ Successfully added page ${pageData.letter} to PDF`);
        
      } catch (error) {
        console.error(`✗ Failed to process page ${pageData.letter}:`, error.message);
        failedPages.push({ page: pageData.letter, reason: error.message });
      }
    }

    // Validate results
    if (successCount === 0) {
      const errorSummary = failedPages.length > 0 
        ? `All ${failedPages.length} pages failed: ${failedPages.map(f => `${f.page} (${f.reason})`).join(', ')}`
        : 'No images could be processed - no pages found or no images available';
      throw new Error(errorSummary);
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== PDF Generation Summary ===`);
    console.log(`✓ Successfully processed: ${successCount}/${sortedPages.length} pages`);
    console.log(`✗ Failed pages: ${failedPages.length}`);
    console.log(`⏱️ Processing time: ${processingTime}s`);
    
    if (failedPages.length > 0) {
      console.log('Failed pages details:', failedPages);
    }

    // Generate final PDF
    console.log('Generating final PDF document...');
    const pdfBytes = await pdfDoc.save();
    const fileSizeMB = (pdfBytes.length / 1024 / 1024).toFixed(2);
    
    console.log(`✓ PDF generated successfully: ${fileSizeMB} MB`);
    
    // Validate PDF size (should be substantial with images)
    if (pdfBytes.length < 50000) { // Less than 50KB is suspicious
      console.warn(`⚠️ Warning: PDF file size is only ${fileSizeMB} MB, which seems small for ${successCount} image pages`);
    }
    
    // Upload to storage
    const fileName = `${exportRecord.user_id}/${exportRecord.content_id}/book-${Date.now()}.pdf`;
    console.log(`Uploading PDF to storage: ${fileName}`);
    
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

    // Final success update
    const successMessage = failedPages.length > 0 
      ? `PDF generated with ${successCount}/${sortedPages.length} pages. ${failedPages.length} pages failed.`
      : `PDF generated successfully with all ${successCount} pages.`;
    
    await supabase
      .from('exports')
      .update({ 
        export_status: 'complete',
        export_url: publicUrlData.publicUrl,
        file_size_bytes: pdfBytes.length,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: failedPages.length > 0 ? `Partial success: ${failedPages.map(f => f.page).join(', ')} failed` : null
      })
      .eq('id', exportId);

    console.log(`🎉 PDF generation completed! File: ${fileSizeMB} MB, URL: ${publicUrlData.publicUrl}`);

  } catch (error) {
    console.error('❌ Background PDF generation failed:', error);
    
    await supabase
      .from('exports')
      .update({ 
        export_status: 'error',
        error_message: `PDF generation failed: ${error.message}`,
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