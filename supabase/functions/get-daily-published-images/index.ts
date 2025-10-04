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
  placeholder_base64?: string | null;
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

    // Fetch pages with images using JOIN for better performance
    const { data: pagesWithImages, error: fetchError } = await supabase
      .from('pages')
      .select(`
        id, 
        letter, 
        page_number,
        page_image_urls!inner(image_url, placeholder_base64)
      `)
      .eq('book_id', targetBookId)
      .eq('page_image_urls.is_latest', true)
      .eq('page_image_urls.generation_status', 'complete')
      .order('page_number', { ascending: true });

    if (fetchError) {
      console.error('Error fetching pages with images:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pages and images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pagesWithImages || pagesWithImages.length === 0) {
      console.log('No pages with complete images found');
      return new Response(
        JSON.stringify({ error: 'No pages found', images: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build response with page metadata
    const pageImages: PageImage[] = pagesWithImages.map(page => ({
      page_id: page.id,
      letter: page.letter,
      page_number: page.page_number,
      image_url: Array.isArray(page.page_image_urls) ? page.page_image_urls[0]?.image_url || '' : '',
      placeholder_base64: Array.isArray(page.page_image_urls) ? page.page_image_urls[0]?.placeholder_base64 || null : null,
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
