import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processAllPages() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[BACKFILL] Background task started...');

  // Get ALL page_image_urls that have image_url but no text_image_url
  const { data: pages, error: fetchError } = await supabase
    .from('page_image_urls')
    .select(`id, page_id, book_id, user_id, image_url`)
    .not('image_url', 'is', null)
    .is('text_image_url', null)
    .eq('is_latest', true);

  if (fetchError) {
    console.error('[BACKFILL] Error fetching pages:', fetchError);
    return;
  }

  console.log(`[BACKFILL] Found ${pages?.length || 0} pages to process`);

  if (!pages || pages.length === 0) {
    console.log('[BACKFILL] No pages need processing');
    return;
  }

  // Get page titles
  const pageIds = pages.map(p => p.page_id);
  const { data: pageDetails, error: pageError } = await supabase
    .from('pages')
    .select('id, title')
    .in('id', pageIds);

  if (pageError) {
    console.error('[BACKFILL] Error fetching page details:', pageError);
    return;
  }

  const pageTitleMap = new Map(pageDetails?.map(p => [p.id, p.title]) || []);

  let processed = 0;
  let failed = 0;

  for (const page of pages) {
    const pageTitle = pageTitleMap.get(page.page_id);
    
    if (!pageTitle || !page.image_url) {
      continue;
    }

    try {
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ 
          text_image_url: page.image_url,
          text_overlay_config: { text: pageTitle, needsProcessing: true }
        })
        .eq('id', page.id);

      if (updateError) throw updateError;
      processed++;
      
      if (processed % 100 === 0) {
        console.log(`[BACKFILL] Progress: ${processed}/${pages.length}`);
      }
    } catch (err) {
      failed++;
      console.error(`[BACKFILL] Failed page ${page.page_id}:`, err);
    }
  }

  console.log(`[BACKFILL] Complete! Processed: ${processed}, Failed: ${failed}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[BACKFILL] Starting background task...');
    
    // Run in background - response returns immediately
    EdgeRuntime.waitUntil(processAllPages());

    return new Response(JSON.stringify({ 
      message: 'Backfill started in background. Check logs for progress.',
      status: 'running'
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
