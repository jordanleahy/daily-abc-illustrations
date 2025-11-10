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

    // Fetch images directly by book_id with page data in a single optimized query
    // Use a join to get page metadata without separate queries
    const { data: imageData, error: imagesError } = await supabase
      .from('page_image_urls')
      .select(`
        page_id,
        image_url,
        pages!inner(
          letter,
          page_number
        )
      `)
      .eq('book_id', targetBookId)
      .eq('is_latest', true)
      .not('image_url', 'is', null)
      .order('pages(page_number)', { ascending: true });

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!imageData || imageData.length === 0) {
      console.log('No images found for book');
      return new Response(
        JSON.stringify({ 
          bookId: targetBookId,
          dailyPublishedId: dailyPublishedId || null,
          totalPages: 0,
          imagesFound: 0,
          images: [],
          cachedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform to PageImage format
    const pageImages: PageImage[] = imageData.map((item: any) => ({
      page_id: item.page_id,
      letter: item.pages?.letter || '',
      page_number: item.pages?.page_number || 0,
      image_url: item.image_url || '',
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
