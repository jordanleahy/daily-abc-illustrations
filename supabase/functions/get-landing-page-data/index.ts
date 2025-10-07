import { createClient } from 'jsr:@supabase/supabase-js@2';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Fetching landing page data in parallel...');

    // Execute all queries in parallel for maximum performance
    const [dailyPublishedResult, popularBooksResult, libraryBooksResult] = await Promise.all([
      // 1. Get active daily published with pages and images
      supabase
        .from('daily_published')
        .select(`
          id,
          book_id,
          title,
          description,
          status,
          is_active,
          expires_at,
          books!inner(id, book_name)
        `)
        .eq('is_active', true)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('publish_date', { ascending: true })
        .limit(1)
        .maybeSingle(),

      // 2. Get popular/highlighted books with SEO metadata
      supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          status,
          is_highlighted
        `)
        .eq('status', 'published')
        .eq('is_highlighted', true)
        .order('updated_at', { ascending: false })
        .limit(6),

      // 3. Get all daily published for library section
      supabase
        .from('daily_published')
        .select(`
          id,
          book_id,
          title,
          description,
          status,
          is_active,
          published_at,
          books!inner(id, book_name, book_description)
        `)
        .in('status', ['active', 'queued', 'expired'])
        .order('published_at', { ascending: false })
    ]);

    if (dailyPublishedResult.error) throw dailyPublishedResult.error;
    if (popularBooksResult.error) throw popularBooksResult.error;
    if (libraryBooksResult.error) throw libraryBooksResult.error;

    const dailyPublished = dailyPublishedResult.data;
    const popularBooks = popularBooksResult.data || [];
    const libraryBooks = libraryBooksResult.data || [];

    // Fetch pages and images for daily published
    let dailyPublishedWithPages = null;
    if (dailyPublished?.book_id) {
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select(`
          id,
          letter,
          page_number,
          title,
          description,
          page_image_urls!inner(
            image_url,
            is_latest,
            generation_status
          )
        `)
        .eq('book_id', dailyPublished.book_id)
        .eq('page_image_urls.is_latest', true)
        .eq('page_image_urls.generation_status', 'complete')
        .order('page_number', { ascending: true });

      if (!pagesError && pages) {
        dailyPublishedWithPages = {
          ...dailyPublished,
          pages: pages.map(p => ({
            id: p.id,
            letter: p.letter,
            page_number: p.page_number,
            title: p.title,
            description: p.description,
            image_url: p.page_image_urls?.[0]?.image_url || null
          }))
        };
      }
    }

    // Fetch SEO metadata for popular books (in parallel)
    const popularBookIds = popularBooks.map(b => b.id);
    let popularBooksWithImages = popularBooks;
    
    if (popularBookIds.length > 0) {
      const { data: seoMetadata, error: seoError } = await supabase
        .from('seo_metadata')
        .select('daily_published_id, og_image_url, is_latest, optimization_status')
        .eq('is_latest', true)
        .eq('optimization_status', 'complete')
        .in('daily_published_id', 
          libraryBooks
            .filter(lb => popularBookIds.includes(lb.book_id))
            .map(lb => lb.id)
        );

      if (!seoError && seoMetadata) {
        const seoMap = new Map(seoMetadata.map(s => [s.daily_published_id, s.og_image_url]));
        
        popularBooksWithImages = popularBooks.map(book => {
          const dpEntry = libraryBooks.find(lb => lb.book_id === book.id);
          return {
            ...book,
            image_url: dpEntry ? seoMap.get(dpEntry.id) : null
          };
        });
      }
    }

    // Fetch SEO metadata for library books (already queried above, reuse)
    const libraryDpIds = libraryBooks.map(lb => lb.id);
    let libraryBooksWithImages = libraryBooks;
    
    if (libraryDpIds.length > 0) {
      const { data: seoMetadata, error: seoError } = await supabase
        .from('seo_metadata')
        .select('daily_published_id, og_image_url, is_latest, optimization_status')
        .eq('is_latest', true)
        .eq('optimization_status', 'complete')
        .in('daily_published_id', libraryDpIds);

      if (!seoError && seoMetadata) {
        const seoMap = new Map(seoMetadata.map(s => [s.daily_published_id, s.og_image_url]));
        
        libraryBooksWithImages = libraryBooks.map(lb => ({
          ...lb,
          og_image_url: seoMap.get(lb.id) || null
        }));
      }
    }

    console.log('✅ Landing page data fetched successfully');
    console.log(`📊 Stats: Daily: ${dailyPublishedWithPages ? 1 : 0}, Popular: ${popularBooksWithImages.length}, Library: ${libraryBooksWithImages.length}`);

    return new Response(
      JSON.stringify({
        dailyPublished: dailyPublishedWithPages,
        popularBooks: popularBooksWithImages,
        libraryBooks: libraryBooksWithImages
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // 5min cache
        } 
      }
    );
  } catch (error) {
    console.error('❌ Error fetching landing page data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
