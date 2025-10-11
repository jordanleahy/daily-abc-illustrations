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

    // Fetch pages for the book
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, letter, page_number')
      .eq('book_id', targetBookId)
      .order('page_number', { ascending: true });

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pages || pages.length === 0) {
      console.log('No pages found for book');
      return new Response(
        JSON.stringify({ error: 'No pages found', images: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all latest complete images for these pages in one query
    const pageIds = pages.map(p => p.id);
    const { data: imageUrls, error: imagesError } = await supabase
      .from('page_image_urls')
      .select('page_id, image_url, placeholder_base64')
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

    // Create a map for quick image lookup
    const imageMap = new Map(imageUrls?.map(img => [img.page_id, img]) || []);

    // Build response with page metadata, only include pages that have images
    const pageImages: PageImage[] = pages
      .filter(page => imageMap.has(page.id))
      .map(page => {
        const imageData = imageMap.get(page.id);
        return {
          page_id: page.id,
          letter: page.letter,
          page_number: page.page_number,
          image_url: imageData?.image_url || '',
          placeholder_base64: imageData?.placeholder_base64 || null,
        };
      });

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
