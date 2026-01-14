import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Uses Lovable AI Gateway to composite a color reference thumbnail onto a B&W coloring page.
 * The AI places a small color reference in the top-left corner of the coloring page.
 */
// Helper to wait between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function compositeImagesWithAI(
  bwImageUrl: string,
  colorImageUrl: string,
  maxRetries: number = 3
): Promise<Uint8Array> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const prompt = `Create a printable coloring page by compositing these two images:
1. Use the BLACK AND WHITE coloring image as the main background (full size)
2. Place the COLOR image as a small reference thumbnail in the TOP-LEFT corner
3. The thumbnail should be about 15-20% of the image width
4. Add a thin dark border around the thumbnail
5. Keep the rest of the coloring page exactly as-is
6. Output should be a clean printable image`;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for AI compositing`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: bwImageUrl } },
                { type: "image_url", image_url: { url: colorImageUrl } }
              ]
            }
          ],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check for rate limiting
        if (response.status === 429 || response.status === 500) {
          const waitTime = attempt * 3000; // Exponential backoff: 3s, 6s, 9s
          console.log(`⏳ Rate limited or server error, waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          lastError = new Error(`AI Gateway error: ${response.status}`);
          continue;
        }
        
        throw new Error(`AI Gateway error: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error('No image returned from AI Gateway');
      }

      // Convert base64 data URL to Uint8Array
      if (imageUrl.startsWith('data:image/')) {
        const base64Data = imageUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      // If it's a URL, fetch it
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      return new Uint8Array(arrayBuffer);
      
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`⏳ Error occurred, waiting ${waitTime}ms before retry: ${error.message}`);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError || new Error('Failed after max retries');
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
      let processedCount = 0;
      
      for (const page of pages) {
        // Skip if already has printable image
        if (page.printable_coloring_image_url) {
          console.log(`⏭️ Skipping page ${page.page_id} - already has printable image`);
          results.push({ pageId: page.page_id, status: 'skipped', reason: 'already exists' });
          continue;
        }

        try {
          // Add delay between requests to avoid rate limiting (except for first)
          if (processedCount > 0) {
            console.log(`⏳ Waiting 2s between requests to avoid rate limiting...`);
            await delay(2000);
          }
          
          console.log(`🎨 Processing page ${page.page_id} with AI compositing`);
          
          // Use AI to composite the images
          const compositedImage = await compositeImagesWithAI(
            page.coloring_image_url,
            page.image_url,
            3 // max retries
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
          processedCount++;

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

    // Use AI to composite the images
    const compositedImage = await compositeImagesWithAI(
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
