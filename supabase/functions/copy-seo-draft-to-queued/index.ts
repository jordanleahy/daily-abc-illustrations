import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    console.log('🔍 Finding queued items that need SEO metadata...');

    // Find queued items that need SEO and have draft versions with SEO
    const { data: needsCopy, error: findError } = await supabase
      .from('daily_published')
      .select(`
        id,
        book_id,
        title,
        status
      `)
      .eq('status', 'queued');

    if (findError) {
      console.error('Error finding queued items:', findError);
      throw findError;
    }

    console.log(`Found ${needsCopy?.length || 0} queued items`);

    let copiedCount = 0;
    const results = [];

    for (const queuedItem of needsCopy || []) {
      // Check if this queued item already has SEO
      const { data: existingSeo } = await supabase
        .from('seo_metadata')
        .select('id')
        .eq('daily_published_id', queuedItem.id)
        .eq('is_latest', true)
        .maybeSingle();

      if (existingSeo) {
        console.log(`⏭️ Skipping ${queuedItem.title} - already has SEO`);
        continue;
      }

      // Find draft version for the same book
      const { data: draftVersion } = await supabase
        .from('daily_published')
        .select('id')
        .eq('book_id', queuedItem.book_id)
        .eq('status', 'draft')
        .maybeSingle();

      if (!draftVersion) {
        console.log(`⚠️ No draft version found for ${queuedItem.title}`);
        results.push({
          queued_id: queuedItem.id,
          title: queuedItem.title,
          status: 'no_draft_found'
        });
        continue;
      }

      // Get SEO from draft version
      const { data: draftSeo } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('daily_published_id', draftVersion.id)
        .eq('is_latest', true)
        .maybeSingle();

      if (!draftSeo) {
        console.log(`⚠️ No SEO metadata found for draft of ${queuedItem.title}`);
        results.push({
          queued_id: queuedItem.id,
          title: queuedItem.title,
          status: 'no_draft_seo'
        });
        continue;
      }

      // Copy SEO to queued version
      const { error: insertError } = await supabase
        .from('seo_metadata')
        .insert({
          daily_published_id: queuedItem.id,
          book_id: draftSeo.book_id,
          seo_title: draftSeo.seo_title,
          seo_description: draftSeo.seo_description,
          og_image_url: draftSeo.og_image_url,
          source_data: draftSeo.source_data,
          optimization_status: draftSeo.optimization_status,
          is_latest: true,
          is_active: true,
          version_number: 1,
          optimized_at: draftSeo.optimized_at,
        });

      if (insertError) {
        console.error(`❌ Error copying SEO for ${queuedItem.title}:`, insertError);
        results.push({
          queued_id: queuedItem.id,
          title: queuedItem.title,
          status: 'error',
          error: insertError.message
        });
      } else {
        console.log(`✅ Copied SEO for ${queuedItem.title}`);
        copiedCount++;
        results.push({
          queued_id: queuedItem.id,
          title: queuedItem.title,
          status: 'copied',
          og_image_url: draftSeo.og_image_url
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        copied_count: copiedCount,
        total_queued: needsCopy?.length || 0,
        results,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Copy SEO error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});