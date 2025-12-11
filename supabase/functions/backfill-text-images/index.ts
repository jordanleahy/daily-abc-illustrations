import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting text image backfill...');

    // Get all page_image_urls that have image_url but no text_image_url
    const { data: pages, error: fetchError } = await supabase
      .from('page_image_urls')
      .select(`
        id,
        page_id,
        book_id,
        user_id,
        image_url
      `)
      .not('image_url', 'is', null)
      .is('text_image_url', null)
      .eq('is_latest', true);

    if (fetchError) {
      console.error('Error fetching pages:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pages?.length || 0} pages without text images`);

    if (!pages || pages.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No pages need text image generation',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get page titles for text overlays
    const pageIds = pages.map(p => p.page_id);
    const { data: pageDetails, error: pageError } = await supabase
      .from('pages')
      .select('id, title, page_number')
      .in('id', pageIds);

    if (pageError) {
      console.error('Error fetching page details:', pageError);
      return new Response(JSON.stringify({ error: pageError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pageTitleMap = new Map(pageDetails?.map(p => [p.id, p.title]) || []);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const page of pages) {
      const pageTitle = pageTitleMap.get(page.page_id);
      
      if (!pageTitle || !page.image_url) {
        console.log(`Skipping page ${page.page_id}: no title or image`);
        continue;
      }

      try {
        console.log(`Processing page ${page.page_id} with title: ${pageTitle}`);

        // Fetch the color image
        const imageResponse = await fetch(page.image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
        const imageDataUrl = `data:${imageBlob.type};base64,${base64Image}`;

        // Use the AI gateway to composite text onto image
        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        if (!lovableApiKey) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Add a semi-transparent black bar (60% opacity) at the bottom of this image, taking up about 15% of the image height. On this bar, add the following text in white, bold, centered font: "${pageTitle}". Keep the rest of the image exactly as is. Return only the modified image.`
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imageDataUrl }
                  }
                ]
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImageUrl) {
          throw new Error('No image returned from AI');
        }

        // Convert base64 to blob for upload
        const base64Data = generatedImageUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const textImageBlob = new Blob([bytes], { type: 'image/png' });

        // Upload to storage
        const fileName = `${page.user_id}/pages/${page.page_id}/text-backfill-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('page-images')
          .upload(fileName, textImageBlob, { contentType: 'image/png', upsert: false });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage.from('page-images').getPublicUrl(fileName);

        // Update the page_image_urls record
        const { error: updateError } = await supabase
          .from('page_image_urls')
          .update({ text_image_url: publicUrlData.publicUrl })
          .eq('id', page.id);

        if (updateError) {
          throw new Error(`Update error: ${updateError.message}`);
        }

        processed++;
        console.log(`Successfully processed page ${page.page_id}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        failed++;
        const errorMsg = `Page ${page.page_id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`Backfill complete. Processed: ${processed}, Failed: ${failed}`);

    return new Response(JSON.stringify({
      message: 'Text image backfill complete',
      total: pages.length,
      processed,
      failed,
      errors: errors.slice(0, 10) // Return first 10 errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
