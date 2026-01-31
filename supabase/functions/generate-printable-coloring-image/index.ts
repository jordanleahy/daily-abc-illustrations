import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode as decodePng, encode as encodePng } from "https://deno.land/x/pngs@0.1.1/mod.ts";
import { decode as decodeJpeg } from "https://deno.land/x/jpegts@1.1/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Compositing configuration for the color reference thumbnail
 */
const THUMBNAIL_CONFIG = {
  scale: 0.18,        // 18% of B&W image width
  padding: 20,        // Pixels from edge (scaled)
  borderWidth: 4,     // Border thickness (scaled)
  borderColor: { r: 51, g: 51, b: 51 }, // Dark gray #333
  shadowOffset: 3,
  shadowBlur: 8,
};

/**
 * Fetches an image from URL and returns raw pixel data with dimensions
 */
async function fetchImageData(url: string): Promise<{
  data: Uint8Array;
  width: number;
  height: number;
}> {
  console.log(`📥 Fetching image: ${url.substring(0, 80)}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Detect format and decode
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 
              && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  
  if (isPng) {
    console.log(`  📄 Detected PNG format`);
    const decoded = decodePng(bytes);
    return {
      data: new Uint8Array(decoded.image),
      width: decoded.width,
      height: decoded.height,
    };
  } else if (isJpeg) {
    console.log(`  📄 Detected JPEG format`);
    const decoded = decodeJpeg(bytes);
    // jpegts already returns RGBA data (4 bytes per pixel) - use directly!
    return {
      data: new Uint8Array(decoded.data),
      width: decoded.width,
      height: decoded.height,
    };
  } else if (isWebP) {
    console.log(`  ⚠️ Detected WebP format - not supported`);
    throw new Error('WebP format detected but not supported. Please use PNG or JPEG source images.');
  } else {
    throw new Error('Unsupported image format. Only PNG and JPEG are supported.');
  }
}

/**
 * Draws a filled rectangle on the pixel buffer
 */
function fillRect(
  buffer: Uint8Array,
  canvasWidth: number,
  x: number,
  y: number,
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
  a: number = 255
) {
  const x1 = Math.max(0, Math.floor(x));
  const y1 = Math.max(0, Math.floor(y));
  const x2 = Math.min(canvasWidth, Math.floor(x + width));
  const y2 = Math.min(buffer.length / (canvasWidth * 4), Math.floor(y + height));
  
  for (let py = y1; py < y2; py++) {
    for (let px = x1; px < x2; px++) {
      const idx = (py * canvasWidth + px) * 4;
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }
}

/**
 * Draws a source image onto the destination buffer with bilinear scaling
 */
function drawImageScaled(
  dest: Uint8Array,
  destWidth: number,
  destHeight: number,
  src: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  destX: number,
  destY: number,
  drawWidth: number,
  drawHeight: number
) {
  const scaleX = srcWidth / drawWidth;
  const scaleY = srcHeight / drawHeight;
  
  for (let dy = 0; dy < drawHeight; dy++) {
    const py = destY + dy;
    if (py < 0 || py >= destHeight) continue;
    
    for (let dx = 0; dx < drawWidth; dx++) {
      const px = destX + dx;
      if (px < 0 || px >= destWidth) continue;
      
      // Source coordinates with bilinear interpolation
      const srcX = dx * scaleX;
      const srcY = dy * scaleY;
      
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcWidth - 1);
      const y1 = Math.min(y0 + 1, srcHeight - 1);
      
      const xFrac = srcX - x0;
      const yFrac = srcY - y0;
      
      // Get 4 source pixels
      const idx00 = (y0 * srcWidth + x0) * 4;
      const idx10 = (y0 * srcWidth + x1) * 4;
      const idx01 = (y1 * srcWidth + x0) * 4;
      const idx11 = (y1 * srcWidth + x1) * 4;
      
      // Bilinear interpolation for each channel
      const destIdx = (py * destWidth + px) * 4;
      for (let c = 0; c < 4; c++) {
        const v00 = src[idx00 + c] || 0;
        const v10 = src[idx10 + c] || 0;
        const v01 = src[idx01 + c] || 0;
        const v11 = src[idx11 + c] || 0;
        
        const top = v00 * (1 - xFrac) + v10 * xFrac;
        const bottom = v01 * (1 - xFrac) + v11 * xFrac;
        const value = top * (1 - yFrac) + bottom * yFrac;
        
        dest[destIdx + c] = Math.round(value);
      }
    }
  }
}

/**
 * Composites color thumbnail onto B&W coloring page at native resolution
 */
async function compositeImagesCanvas(
  bwImageUrl: string,
  colorImageUrl: string
): Promise<Uint8Array> {
  console.log(`🎨 Starting canvas compositing...`);
  
  // Fetch both images
  const [bwImage, colorImage] = await Promise.all([
    fetchImageData(bwImageUrl),
    fetchImageData(colorImageUrl),
  ]);
  
  console.log(`📐 B&W image: ${bwImage.width}x${bwImage.height}`);
  console.log(`📐 Color image: ${colorImage.width}x${colorImage.height}`);
  
  // Create output buffer at B&W native resolution
  const outputWidth = bwImage.width;
  const outputHeight = bwImage.height;
  const outputBuffer = new Uint8Array(outputWidth * outputHeight * 4);
  
  // Copy B&W image as base (1:1, no scaling = no quality loss)
  outputBuffer.set(bwImage.data);
  
  // Calculate thumbnail dimensions (scale based on image size)
  const scaleFactor = outputWidth / 1024; // Reference size for scaling
  const thumbnailWidth = Math.round(outputWidth * THUMBNAIL_CONFIG.scale);
  const thumbnailHeight = Math.round((colorImage.height / colorImage.width) * thumbnailWidth);
  
  const padding = Math.round(THUMBNAIL_CONFIG.padding * scaleFactor);
  const borderWidth = Math.max(2, Math.round(THUMBNAIL_CONFIG.borderWidth * scaleFactor));
  
  const thumbX = padding;
  const thumbY = padding;
  
  // Draw white background (for any transparency in color image)
  fillRect(
    outputBuffer,
    outputWidth,
    thumbX - borderWidth,
    thumbY - borderWidth,
    thumbnailWidth + borderWidth * 2,
    thumbnailHeight + borderWidth * 2,
    255, 255, 255
  );
  
  // Draw border
  fillRect(
    outputBuffer,
    outputWidth,
    thumbX - borderWidth,
    thumbY - borderWidth,
    thumbnailWidth + borderWidth * 2,
    thumbnailHeight + borderWidth * 2,
    THUMBNAIL_CONFIG.borderColor.r,
    THUMBNAIL_CONFIG.borderColor.g,
    THUMBNAIL_CONFIG.borderColor.b
  );
  
  // Draw white inner area
  fillRect(
    outputBuffer,
    outputWidth,
    thumbX,
    thumbY,
    thumbnailWidth,
    thumbnailHeight,
    255, 255, 255
  );
  
  // Draw color thumbnail with high-quality bilinear scaling
  drawImageScaled(
    outputBuffer,
    outputWidth,
    outputHeight,
    colorImage.data,
    colorImage.width,
    colorImage.height,
    thumbX,
    thumbY,
    thumbnailWidth,
    thumbnailHeight
  );
  
  console.log(`✅ Compositing complete, encoding PNG...`);
  
  // Encode as PNG
  const pngBytes = encodePng(outputBuffer, outputWidth, outputHeight);
  
  console.log(`📦 Output PNG size: ${(pngBytes.length / 1024).toFixed(1)}KB`);
  
  return pngBytes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageId, bookId, batchProcess } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Batch processing mode - process pages for a book in chunks to avoid CPU timeout
    if (batchProcess && bookId) {
      const MAX_PAGES_PER_BATCH = 3; // Process max 3 pages per invocation to stay under CPU limits
      
      console.log(`📚 Batch processing printable coloring images for book: ${bookId} (max ${MAX_PAGES_PER_BATCH} pages)`);
      
      // Get all pages with both color and coloring images
      const { data: pages, error: pagesError } = await supabase
        .from('page_image_urls')
        .select('id, page_id, image_url, coloring_image_url, printable_coloring_image_url')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .not('image_url', 'is', null)
        .not('coloring_image_url', 'is', null);

      if (pagesError) {
        throw new Error(`Failed to fetch pages: ${pagesError.message}`);
      }

      if (!pages || pages.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No pages found with both color and coloring images',
            processed: 0,
            hasMore: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Filter to only pages that need processing (no printable image yet)
      const pagesToProcess = pages
        .filter(p => !p.printable_coloring_image_url)
        .slice(0, MAX_PAGES_PER_BATCH);
      
      const totalRemaining = pages.filter(p => !p.printable_coloring_image_url).length;
      
      console.log(`📄 Found ${pages.length} total pages, ${totalRemaining} need processing, processing ${pagesToProcess.length} this batch`);

      // If no pages need processing, return early
      if (pagesToProcess.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'All pages already have printable images',
            summary: { success: 0, skipped: pages.length, errors: 0, remaining: 0 },
            hasMore: false,
            results: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];
      
      for (const page of pagesToProcess) {
        try {
          console.log(`🎨 Processing page ${page.page_id} with canvas compositing`);
          
          // Use canvas to composite the images
          const compositedImage = await compositeImagesCanvas(
            page.coloring_image_url,
            page.image_url
          );

          // Upload to storage
          const fileName = `printable-coloring/${bookId}/${page.page_id}_${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('page-images')
            .upload(fileName, compositedImage, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('page-images')
            .getPublicUrl(fileName);

          // Update database
          const { error: updateError } = await supabase
            .from('page_image_urls')
            .update({ printable_coloring_image_url: urlData.publicUrl })
            .eq('id', page.id);

          if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          console.log(`✅ Successfully processed page ${page.page_id}`);
          results.push({ 
            pageId: page.page_id, 
            status: 'success', 
            url: urlData.publicUrl 
          });

        } catch (pageError) {
          console.error(`❌ Error processing page ${page.page_id}:`, pageError);
          results.push({ 
            pageId: page.page_id, 
            status: 'error', 
            error: pageError.message 
          });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const remainingAfterBatch = totalRemaining - successCount;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${pagesToProcess.length} pages this batch`,
          summary: { 
            success: successCount, 
            skipped: 0, 
            errors: errorCount, 
            remaining: remainingAfterBatch 
          },
          hasMore: remainingAfterBatch > 0,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single page processing
    if (!pageId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing pageId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🖼️ Generating printable coloring image for page: ${pageId}`);

    // Get the page image data
    const { data: pageData, error: pageError } = await supabase
      .from('page_image_urls')
      .select('id, book_id, image_url, coloring_image_url')
      .eq('page_id', pageId)
      .eq('is_latest', true)
      .single();

    if (pageError || !pageData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Page image data not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pageData.image_url || !pageData.coloring_image_url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Page requires both color image and coloring image' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use canvas to composite the images
    const compositedImage = await compositeImagesCanvas(
      pageData.coloring_image_url,
      pageData.image_url
    );

    // Upload to storage
    const fileName = `printable-coloring/${pageData.book_id}/${pageId}_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(fileName, compositedImage, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('page-images')
      .getPublicUrl(fileName);

    // Update database
    const { error: updateError } = await supabase
      .from('page_image_urls')
      .update({ printable_coloring_image_url: urlData.publicUrl })
      .eq('id', pageData.id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`✅ Successfully generated printable coloring image`);

    return new Response(
      JSON.stringify({
        success: true,
        printableColoringImageUrl: urlData.publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating printable coloring image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
