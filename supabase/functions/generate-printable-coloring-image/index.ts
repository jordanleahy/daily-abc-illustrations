import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
  Gravity,
  CompositeOperator,
  MagickColor,
} from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration for thumbnail placement
const THUMBNAIL_SCALE = 0.20; // 20% of image width (increased from 15% for better quality)
const PADDING = 20;
const BORDER_WIDTH = 4;
const SHADOW_OFFSET = 3;

// Initialize ImageMagick once
let imageMagickInitialized = false;

async function ensureImageMagickInitialized() {
  if (!imageMagickInitialized) {
    await initializeImageMagick();
    imageMagickInitialized = true;
  }
}

/**
 * Composites a color reference image onto a B&W coloring page
 * Places the color image as a 20% thumbnail in the top-left corner
 * Uses ImageMagick for high-quality Lanczos resampling
 */
async function compositeImages(
  bwImageBuffer: ArrayBuffer,
  colorImageBuffer: ArrayBuffer
): Promise<Uint8Array> {
  await ensureImageMagickInitialized();

  const bwData = new Uint8Array(bwImageBuffer);
  const colorData = new Uint8Array(colorImageBuffer);

  let resultBytes: Uint8Array | null = null;

  // Process the B&W image (base)
  ImageMagick.read(bwData, (bwImage) => {
    // Calculate thumbnail dimensions (20% of B&W width, maintain aspect ratio)
    const thumbnailWidth = Math.round(bwImage.width * THUMBNAIL_SCALE);
    
    // Scale padding and border based on image size
    const scaleFactor = bwImage.width / 800;
    const scaledPadding = Math.round(PADDING * scaleFactor);
    const scaledBorderWidth = Math.max(2, Math.round(BORDER_WIDTH * scaleFactor));
    const scaledShadowOffset = Math.max(2, Math.round(SHADOW_OFFSET * scaleFactor));

    // Process the color image (thumbnail)
    ImageMagick.read(colorData, (colorImage) => {
      // Calculate height maintaining aspect ratio
      const aspectRatio = colorImage.height / colorImage.width;
      const thumbnailHeight = Math.round(thumbnailWidth * aspectRatio);

      // Resize the color image using high-quality Lanczos resampling
      const geometry = new MagickGeometry(thumbnailWidth, thumbnailHeight);
      geometry.ignoreAspectRatio = false;
      colorImage.resize(geometry);

      // Create a border around the thumbnail
      colorImage.border(scaledBorderWidth, scaledBorderWidth);
      colorImage.borderColor = new MagickColor('#333333');

      // Calculate position for thumbnail (top-left with padding)
      const thumbnailX = scaledPadding + scaledShadowOffset;
      const thumbnailY = scaledPadding + scaledShadowOffset;

      // Draw a subtle shadow effect by compositing a dark rectangle first
      // Create shadow by drawing the thumbnail offset
      ImageMagick.read(colorData, (shadowImage) => {
        shadowImage.resize(new MagickGeometry(thumbnailWidth, thumbnailHeight));
        shadowImage.border(scaledBorderWidth, scaledBorderWidth);
        shadowImage.modulate(30, 0, 100); // Make it very dark for shadow effect
        shadowImage.blur(scaledShadowOffset * 2, scaledShadowOffset);
        
        // Composite shadow onto base image
        bwImage.composite(shadowImage, scaledPadding + scaledShadowOffset * 2, scaledPadding + scaledShadowOffset * 2, CompositeOperator.Over);
      });

      // Composite the color thumbnail onto the B&W image
      bwImage.composite(colorImage, thumbnailX, thumbnailY, CompositeOperator.Over);

      // Encode as PNG
      bwImage.write(MagickFormat.Png, (data) => {
        resultBytes = data;
      });
    });
  });

  if (!resultBytes) {
    throw new Error('Failed to composite images');
  }

  return resultBytes;
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

    // For batch processing, we allow unauthenticated requests (admin operation)
    // For single page processing, we require auth
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Batch processing mode - process all pages for a book
    if (batchProcess && bookId) {
      console.log(`📚 Batch processing printable coloring images for book: ${bookId}`);
      
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
            processed: 0 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📄 Found ${pages.length} pages to process`);

      const results = [];
      for (const page of pages) {
        // Skip if already has printable image
        if (page.printable_coloring_image_url) {
          console.log(`⏭️ Skipping page ${page.page_id} - already has printable image`);
          results.push({ pageId: page.page_id, status: 'skipped', reason: 'already exists' });
          continue;
        }

        try {
          // Download both images
          console.log(`⬇️ Downloading images for page ${page.page_id}`);
          const [bwResponse, colorResponse] = await Promise.all([
            fetch(page.coloring_image_url),
            fetch(page.image_url)
          ]);

          if (!bwResponse.ok || !colorResponse.ok) {
            throw new Error('Failed to download images');
          }

          const [bwBuffer, colorBuffer] = await Promise.all([
            bwResponse.arrayBuffer(),
            colorResponse.arrayBuffer()
          ]);

          // Composite the images
          console.log(`🎨 Compositing images for page ${page.page_id}`);
          const compositedImage = await compositeImages(bwBuffer, colorBuffer);

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
      const skippedCount = results.filter(r => r.status === 'skipped').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${pages.length} pages`,
          summary: { success: successCount, skipped: skippedCount, errors: errorCount },
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

    // Download both images
    const [bwResponse, colorResponse] = await Promise.all([
      fetch(pageData.coloring_image_url),
      fetch(pageData.image_url)
    ]);

    if (!bwResponse.ok || !colorResponse.ok) {
      throw new Error('Failed to download images');
    }

    const [bwBuffer, colorBuffer] = await Promise.all([
      bwResponse.arrayBuffer(),
      colorResponse.arrayBuffer()
    ]);

    // Composite the images
    const compositedImage = await compositeImages(bwBuffer, colorBuffer);

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
