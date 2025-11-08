import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageImage {
  page_id: string;
  letter: string;
  page_number: number;
  image_url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { dailyPublishedId, bookId } = await req.json();

    if (!dailyPublishedId && !bookId) {
      return new Response(
        JSON.stringify({ error: 'Either dailyPublishedId or bookId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If dailyPublishedId provided, get the book_id first
    let targetBookId = bookId;
    if (dailyPublishedId && !bookId) {
      const { data: dpData, error: dpError } = await supabase
        .from('daily_published')
        .select('book_id, is_active, expires_at')
        .eq('id', dailyPublishedId)
        .single();

      if (dpError || !dpData) {
        console.error('Error fetching daily published:', dpError);
        return new Response(
          JSON.stringify({ error: 'Daily published content not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if content is still active
      if (!dpData.is_active || (dpData.expires_at && new Date(dpData.expires_at) < new Date())) {
        return new Response(
          JSON.stringify({ error: 'Content has expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetBookId = dpData.book_id;
    }

    // Step 1: Fetch pages for the target book (simple indexed query)
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, letter, page_number')
      .eq('book_id', targetBookId)
      .order('page_number', { ascending: true })
      .limit(60); // Safety limit

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pages || pages.length === 0) {
      return new Response(
        JSON.stringify({ bookId: targetBookId, totalPages: 0, imagesFound: 0, images: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch latest image URLs for these pages (uses idx_page_image_urls_page_latest)
    const pageIds = pages.map((p) => p.id);
    const { data: imageRows, error: imagesError } = await supabase
      .from('page_image_urls')
      .select('page_id, image_url')
      .in('page_id', pageIds)
      .eq('is_latest', true)
      .not('image_url', 'is', null);

    if (imagesError) {
      console.error('Error fetching page images:', imagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build a map of page_id -> image_url and construct response array
    const imageMap = new Map<string, string>((imageRows || []).map((r: any) => [r.page_id, r.image_url]));

    const pageImages: PageImage[] = (pages || [])
      .map((p: any) => ({
        page_id: p.id,
        letter: p.letter,
        page_number: p.page_number,
        image_url: imageMap.get(p.id) || ''
      }))
      .filter((img) => !!img.image_url);


    // Add aggressive caching headers (cache images list for 10 minutes)
    const cacheHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800',
      'CDN-Cache-Control': 'public, max-age=600',
      'Vercel-CDN-Cache-Control': 'public, max-age=600',
    };

    return new Response(
      JSON.stringify({
        bookId: targetBookId,
        dailyPublishedId: dailyPublishedId || null,
        totalPages: pageImages.length,
        imagesFound: pageImages.length,
        images: pageImages,
        cachedAt: new Date().toISOString(),
      }),
      { 
        status: 200, 
        headers: cacheHeaders,
      }
    );
  } catch (error) {
    console.error('Error in get-daily-published-images:', error);
    return new Response(
      JSON.stringify({ error: error.message, images: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
