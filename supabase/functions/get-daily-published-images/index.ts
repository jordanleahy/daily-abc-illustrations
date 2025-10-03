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

    // Fetch all pages for the book
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, letter, page_number')
      .eq('book_id', targetBookId)
      .order('page_number', { ascending: true });

    if (pagesError || !pages || pages.length === 0) {
      console.error('Error fetching pages:', pagesError);
      return new Response(
        JSON.stringify({ error: 'No pages found', images: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageIds = pages.map(p => p.id);

    // Fetch all latest image URLs in one query
    const { data: images, error: imagesError } = await supabase
      .from('page_image_urls')
      .select('page_id, image_url')
      .in('page_id', pageIds)
      .eq('is_latest', true)
      .eq('generation_status', 'complete');

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map images to pages for easier lookup
    const imageMap = new Map(images?.map(img => [img.page_id, img.image_url]) || []);

    // Build response with page metadata
    const pageImages: PageImage[] = pages.map(page => ({
      page_id: page.id,
      letter: page.letter,
      page_number: page.page_number,
      image_url: imageMap.get(page.id) || '',
    }));

    // Add aggressive caching headers (1 hour for active content)
    const cacheHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
      'CDN-Cache-Control': 'public, max-age=3600',
      'Vercel-CDN-Cache-Control': 'public, max-age=3600',
    };

    return new Response(
      JSON.stringify({
        bookId: targetBookId,
        dailyPublishedId: dailyPublishedId || null,
        totalPages: pages.length,
        imagesFound: images?.length || 0,
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
