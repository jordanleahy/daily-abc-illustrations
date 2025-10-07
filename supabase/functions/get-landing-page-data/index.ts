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

    console.log('🚀 Starting landing page data fetch...');
    const startTime = Date.now();

    // Execute all queries in parallel for maximum performance
    console.log('📊 Step 1: Fetching core data (daily published, popular books, library books)...');
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

    console.log('✅ Step 1 complete:', {
      dailyPublished: !!dailyPublishedResult.data,
      popularBooksCount: popularBooksResult.data?.length || 0,
      libraryBooksCount: libraryBooksResult.data?.length || 0
    });

    if (dailyPublishedResult.error) {
      console.error('❌ Error fetching daily published:', dailyPublishedResult.error);
      throw dailyPublishedResult.error;
    }
    if (popularBooksResult.error) {
      console.error('❌ Error fetching popular books:', popularBooksResult.error);
      throw popularBooksResult.error;
    }
    if (libraryBooksResult.error) {
      console.error('❌ Error fetching library books:', libraryBooksResult.error);
      throw libraryBooksResult.error;
    }

    const dailyPublished = dailyPublishedResult.data;
    const popularBooks = popularBooksResult.data || [];
    const libraryBooks = libraryBooksResult.data || [];

    console.log('📊 Step 2: Fetching pages and SEO metadata in parallel...');

    // Fetch pages and SEO metadata in parallel to eliminate waterfalls
    let dailyPublishedWithPages = null;
    const popularBookIds = popularBooks.map(b => b.id);
    const libraryDpIds = libraryBooks.map(lb => lb.id);

    // Build promises for parallel execution
    const pagesPromise = dailyPublished?.book_id
      ? (async () => {
          console.log('  📄 Fetching pages for daily published book:', dailyPublished.book_id);
          
          // First get pages
          const pagesResult = await supabase
            .from('pages')
            .select('id, letter, page_number, title, description')
            .eq('book_id', dailyPublished.book_id)
            .order('page_number', { ascending: true });

          if (pagesResult.error) {
            console.error('  ❌ Error fetching pages:', pagesResult.error);
            return { data: null, error: pagesResult.error };
          }

          if (!pagesResult.data || pagesResult.data.length === 0) {
            console.log('  ⚠️ No pages found for book');
            return { data: [], error: null };
          }

          console.log(`  ✅ Found ${pagesResult.data.length} pages, fetching images...`);

          // Then get images for those pages
          const pageIds = pagesResult.data.map(p => p.id);
          const imagesResult = await supabase
            .from('page_image_urls')
            .select('page_id, image_url, is_latest, generation_status')
            .in('page_id', pageIds)
            .eq('is_latest', true)
            .eq('generation_status', 'complete');

          if (imagesResult.error) {
            console.error('  ❌ Error fetching images:', imagesResult.error);
            // Continue without images rather than failing
            return { data: pagesResult.data.map(p => ({ ...p, image_url: null })), error: null };
          }

          console.log(`  ✅ Found ${imagesResult.data?.length || 0} images`);

          // Merge pages with their images
          const imageMap = new Map(imagesResult.data?.map(img => [img.page_id, img.image_url]) || []);
          const pagesWithImages = pagesResult.data.map(page => ({
            ...page,
            image_url: imageMap.get(page.id) || null
          }));

          return { data: pagesWithImages, error: null };
        })()
      : Promise.resolve({ data: null, error: null });

    const seoPromise = libraryDpIds.length > 0
      ? (async () => {
          console.log('  🎨 Fetching SEO metadata for', libraryDpIds.length, 'items...');
          const result = await supabase
            .from('seo_metadata')
            .select('daily_published_id, og_image_url, is_latest, optimization_status')
            .eq('is_latest', true)
            .eq('optimization_status', 'complete')
            .in('daily_published_id', libraryDpIds);

          if (result.error) {
            console.error('  ❌ Error fetching SEO metadata:', result.error);
          } else {
            console.log(`  ✅ Found ${result.data?.length || 0} SEO metadata items`);
          }

          return result;
        })()
      : Promise.resolve({ data: [], error: null });

    const [pagesResult, seoResult] = await Promise.all([pagesPromise, seoPromise]);

    console.log('✅ Step 2 complete');

    const pages = pagesResult.data;
    const pagesError = pagesResult.error;
    const seoMetadata = seoResult.data || [];
    const seoError = seoResult.error;

    if (pagesError) {
      console.error('⚠️ Pages fetch had error, but continuing:', pagesError);
    }

    if (seoError) {
      console.error('⚠️ SEO metadata fetch had error, but continuing:', seoError);
    }

    // Build daily published with pages
    if (!pagesError && pages && dailyPublished) {
      dailyPublishedWithPages = {
        ...dailyPublished,
        pages: Array.isArray(pages) ? pages.map((p: any) => ({
          id: p.id,
          letter: p.letter,
          page_number: p.page_number,
          title: p.title,
          description: p.description,
          image_url: p.image_url || null
        })) : []
      };
      console.log(`📖 Daily published book has ${dailyPublishedWithPages.pages.length} pages`);
    }

    // Build SEO map once and reuse for both popular and library
    const seoMap = !seoError && seoMetadata
      ? new Map(seoMetadata.map((s: any) => [s.daily_published_id, s.og_image_url]))
      : new Map();

    // Map images for popular books using library linkage to daily_published
    let popularBooksWithImages = popularBooks;
    if (popularBookIds.length > 0 && libraryBooks.length > 0) {
      popularBooksWithImages = popularBooks.map(book => {
        const dpEntry = libraryBooks.find(lb => lb.book_id === book.id);
        return {
          ...book,
          image_url: dpEntry ? (seoMap.get(dpEntry.id) || null) : null
        };
      });
    }

    // Map images for library books directly
    let libraryBooksWithImages = libraryBooks;
    if (libraryDpIds.length > 0) {
      libraryBooksWithImages = libraryBooks.map(lb => ({
        ...lb,
        og_image_url: seoMap.get(lb.id) || null
      }));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Landing page data fetched successfully');
    console.log(`📊 Final stats: Daily: ${dailyPublishedWithPages ? 1 : 0}, Popular: ${popularBooksWithImages.length}, Library: ${libraryBooksWithImages.length}`);
    console.log(`⏱️ Total execution time: ${duration}ms`);

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
    console.error('❌ FATAL ERROR fetching landing page data:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check edge function logs for more information'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
