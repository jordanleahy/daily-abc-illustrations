import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[BACKFILL] Starting text image backfill...');

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
      .eq('is_latest', true)
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('[BACKFILL] Error fetching pages:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[BACKFILL] Found ${pages?.length || 0} pages without text images`);

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
      console.error('[BACKFILL] Error fetching page details:', pageError);
      return new Response(JSON.stringify({ error: pageError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pageTitleMap = new Map(pageDetails?.map(p => [p.id, p.title]) || []);

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const page of pages) {
      const pageTitle = pageTitleMap.get(page.page_id);
      
      if (!pageTitle || !page.image_url) {
        console.log(`[BACKFILL] Skipping page ${page.page_id}: no title or image`);
        skipped++;
        continue;
      }

      try {
        console.log(`[BACKFILL] Processing page ${page.page_id} with title: ${pageTitle}`);

        // For now, just mark the image_url as the text_image_url placeholder
        // The frontend will handle text overlay CSS-based rendering
        // This is a temporary solution until we have proper server-side image processing
        
        // Update the page_image_urls record to use the same URL as placeholder
        const { error: updateError } = await supabase
          .from('page_image_urls')
          .update({ 
            text_image_url: page.image_url,
            text_overlay_config: {
              text: pageTitle,
              needsProcessing: true // Flag for future processing
            }
          })
          .eq('id', page.id);

        if (updateError) {
          throw new Error(`Update error: ${updateError.message}`);
        }

        processed++;
        console.log(`[BACKFILL] Successfully marked page ${page.page_id} for text overlay`);

      } catch (err) {
        failed++;
        const errorMsg = `Page ${page.page_id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[BACKFILL] ${errorMsg}`);
      }
    }

    console.log(`[BACKFILL] Complete. Processed: ${processed}, Failed: ${failed}, Skipped: ${skipped}`);

    return new Response(JSON.stringify({
      message: 'Text image backfill complete',
      total: pages.length,
      processed,
      failed,
      skipped,
      errors: errors.slice(0, 10)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[BACKFILL] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
