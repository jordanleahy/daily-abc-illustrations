import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration for thumbnail placement
const THUMBNAIL_SCALE = 0.15; // 15% of image width
const PADDING = 15;
const BORDER_WIDTH = 3;
const BORDER_COLOR = '#333333';
const SHADOW_BLUR = 8;

/**
 * Composites a color reference image onto a B&W coloring page
 * Places the color image as a 15% thumbnail in the top-left corner
 */
async function compositeImages(
  bwImageBuffer: ArrayBuffer,
  colorImageBuffer: ArrayBuffer
): Promise<Uint8Array> {
  // Use Deno's native image processing via canvas-like approach
  // Since Deno doesn't have Canvas API natively, we'll use imagescript
  const { Image } = await import("https://deno.land/x/imagescript@1.3.0/mod.ts");

  // Decode both images
  const bwImage = await Image.decode(new Uint8Array(bwImageBuffer));
  const colorImage = await Image.decode(new Uint8Array(colorImageBuffer));

  // Calculate thumbnail dimensions (15% of B&W width, maintain aspect ratio)
  const thumbnailWidth = Math.round(bwImage.width * THUMBNAIL_SCALE);
  const thumbnailHeight = Math.round(
    (colorImage.height / colorImage.width) * thumbnailWidth
  );

  // Resize color image to thumbnail size
  const thumbnail = colorImage.resize(thumbnailWidth, thumbnailHeight);

  // Scale padding and border based on image size
  const scaleFactor = bwImage.width / 800;
  const scaledPadding = Math.round(PADDING * scaleFactor);
  const scaledBorderWidth = Math.max(2, Math.round(BORDER_WIDTH * scaleFactor));

  // Position for thumbnail (top-left with padding)
  const thumbnailX = scaledPadding + scaledBorderWidth;
  const thumbnailY = scaledPadding + scaledBorderWidth;

  // Draw white background rectangle for the thumbnail area (including border)
  const bgX = scaledPadding;
  const bgY = scaledPadding;
  const bgWidth = thumbnailWidth + scaledBorderWidth * 2;
  const bgHeight = thumbnailHeight + scaledBorderWidth * 2;

  // Parse border color
  const borderColorInt = parseInt(BORDER_COLOR.slice(1), 16);
  const borderR = (borderColorInt >> 16) & 0xFF;
  const borderG = (borderColorInt >> 8) & 0xFF;
  const borderB = borderColorInt & 0xFF;

  // Draw border (dark rectangle)
  for (let y = bgY; y < bgY + bgHeight && y < bwImage.height; y++) {
    for (let x = bgX; x < bgX + bgWidth && x < bwImage.width; x++) {
      bwImage.setPixelAt(x + 1, y + 1, Image.rgbaToColor(borderR, borderG, borderB, 255));
    }
  }

  // Draw white background
  for (let y = bgY; y < bgY + bgHeight - scaledBorderWidth && y < bwImage.height; y++) {
    for (let x = bgX; x < bgX + bgWidth - scaledBorderWidth && x < bwImage.width; x++) {
      bwImage.setPixelAt(x + 1, y + 1, Image.rgbaToColor(255, 255, 255, 255));
    }
  }

  // Composite the thumbnail onto the B&W image
  bwImage.composite(thumbnail, thumbnailX, thumbnailY);

  // Encode as PNG
  return await bwImage.encode();
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

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
            .from('images')
            .upload(fileName, compositedImage, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('images')
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
      .from('images')
      .upload(fileName, compositedImage, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
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
