import { createClient } from 'jsr:@supabase/supabase-js@2';
import { toZonedTime, format } from 'https://esm.sh/date-fns-tz@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get today's date in Eastern Time (source of truth for publishing)
function getTodayEastern(): string {
  const now = new Date();
  const easternTime = toZonedTime(now, 'America/New_York');
  return format(easternTime, 'yyyy-MM-dd');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const todayEastern = getTodayEastern();
    console.log('🚀 Starting landing page data fetch for date:', todayEastern);
    const startTime = Date.now();

    // Execute all queries in parallel for maximum performance
    console.log('📊 Step 1: Fetching core data (daily published, popular books, library books)...');
    const [dailyPublishedResult, popularBooksResult, libraryBooksResult] = await Promise.all([
      // 1. Get today's daily published by publish_date (source of truth)
      // This works regardless of whether the cron job has updated status
      supabase
        .from('daily_published')
        .select(`
          id,
          book_id,
          title,
          description,
          status,
          expires_at,
          books!inner(id, book_name)
        `)
        .eq('publish_date', todayEastern)
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
          is_highlighted,
          metadata
        `)
        .eq('status', 'published')
        .eq('is_highlighted', true)
        .order('updated_at', { ascending: false })
        .limit(6),

      // 3. Get library books directly from books table
      supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          status,
          is_highlighted,
          created_at,
          updated_at,
          metadata
        `)
        .eq('is_library_book', true)
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(20)
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
    const libraryBookIds = libraryBooks.map(lb => lb.id);

    // Build promises for parallel execution
    const pagesPromise = dailyPublished?.book_id
      ? (async () => {
          console.log('  📄 Fetching pages for daily published book:', dailyPublished.book_id);
          
          // First get only 3 pages (performance optimization - lazy load remaining)
          const pagesResult = await supabase
            .from('pages')
            .select('id, letter, page_number, title, description')
            .eq('book_id', dailyPublished.book_id)
            .order('page_number', { ascending: true })
            .limit(3);

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
            .select('page_id, image_url, is_latest')
            .in('page_id', pageIds)
            .eq('is_latest', true)
            .not('image_url', 'is', null);

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

    // No SEO promise needed - library books now fetch images directly from page_image_urls
    const seoPromise = Promise.resolve({ data: [], error: null });

    // Fetch thumbnails for popular books directly (independent of daily_published status)
    const popularBookThumbnailsPromise = popularBookIds.length > 0
      ? (async () => {
          console.log('  🎨 Fetching thumbnails for', popularBookIds.length, 'popular books...');
          
          // Try to get SEO metadata first (from ANY daily_published status)
          const dpResult = await supabase
            .from('daily_published')
            .select('id, book_id, status')
            .in('book_id', popularBookIds)
            .order('created_at', { ascending: false });
          
          const bookToDpMap = new Map();
          if (dpResult.data) {
            // Keep only the most recent daily_published entry per book
            dpResult.data.forEach(dp => {
              if (!bookToDpMap.has(dp.book_id)) {
                bookToDpMap.set(dp.book_id, dp.id);
              }
            });
          }
          
          const dpIds = Array.from(bookToDpMap.values());
          
          // Get SEO metadata for those daily_published entries
          let seoThumbnailMap = new Map();
          if (dpIds.length > 0) {
            const seoResult = await supabase
              .from('seo_metadata')
              .select('daily_published_id, og_image_url')
              .in('daily_published_id', dpIds)
              .eq('is_latest', true)
              .eq('optimization_status', 'complete')
              .not('og_image_url', 'is', null);
            
            if (seoResult.data) {
              // Map book_id -> og_image_url
              seoResult.data.forEach(seo => {
                const bookId = Array.from(bookToDpMap.entries())
                  .find(([, dpId]) => dpId === seo.daily_published_id)?.[0];
                if (bookId) {
                  seoThumbnailMap.set(bookId, seo.og_image_url);
                }
              });
            }
          }
          
          // Fallback: Get first page images for books without SEO thumbnails
          const booksNeedingFallback = popularBookIds.filter(id => !seoThumbnailMap.has(id));
          
          if (booksNeedingFallback.length > 0) {
            console.log(`  🔄 Falling back to page images for ${booksNeedingFallback.length} books`);
            // Get all pages for these books
            const pagesResult = await supabase
              .from('pages')
              .select('id, book_id, page_number')
              .in('book_id', booksNeedingFallback)
              .eq('page_type', 'cover');
            
            if (pagesResult.data && pagesResult.data.length > 0) {
              const pageIds = pagesResult.data.map(p => p.id);
              
              // Get page images
              const imagesResult = await supabase
                .from('page_image_urls')
                .select('page_id, image_url')
                .in('page_id', pageIds)
                .eq('is_latest', true)
                .not('image_url', 'is', null);
              
              if (imagesResult.data) {
                // Map page_id -> book_id -> image_url
                imagesResult.data.forEach(img => {
                  const page = pagesResult.data.find(p => p.id === img.page_id);
                  if (page && !seoThumbnailMap.has(page.book_id)) {
                    seoThumbnailMap.set(page.book_id, img.image_url);
                  }
                });
              }
            }
          }
          
          console.log(`  ✅ Found ${seoThumbnailMap.size}/${popularBookIds.length} popular book thumbnails`);
          return { data: seoThumbnailMap, error: null };
        })()
      : Promise.resolve({ data: new Map(), error: null });

    const [pagesResult, seoResult, popularThumbnailsResult] = await Promise.all([
      pagesPromise, 
      seoPromise,
      popularBookThumbnailsPromise
    ]);

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
      ? new Map(seoMetadata.map((s: any) => [s.daily_published_id, { og_image_url: s.og_image_url, seo_title: s.seo_title }]))
      : new Map();

    // Map thumbnails for popular books using dedicated query
    const popularThumbnailMap = popularThumbnailsResult.data || new Map();
    const popularBooksWithImages = popularBooks.map(book => ({
      ...book,
      image_url: popularThumbnailMap.get(book.id) || null
    }));

    console.log(`🎨 Popular books with images: ${popularBooksWithImages.filter(b => b.image_url).length}/${popularBooks.length}`);

    // Fetch cover page images for library books
    let libraryBooksWithImages = libraryBooks;
    if (libraryBookIds.length > 0) {
      console.log(`🔄 Fetching cover images for ${libraryBookIds.length} library books`);
      
      const pagesResult = await supabase
        .from('pages')
        .select('id, book_id, page_number')
        .in('book_id', libraryBookIds)
        .eq('page_type', 'cover');
      
      if (pagesResult.data && pagesResult.data.length > 0) {
        const pageIds = pagesResult.data.map(p => p.id);
        const imagesResult = await supabase
          .from('page_image_urls')
          .select('page_id, image_url')
          .in('page_id', pageIds)
          .eq('is_latest', true)
          .not('image_url', 'is', null);
        
        if (imagesResult.data) {
          const imageMap = new Map();
          imagesResult.data.forEach(img => {
            const page = pagesResult.data.find(p => p.id === img.page_id);
            if (page) {
              imageMap.set(page.book_id, img.image_url);
            }
          });
          
          libraryBooksWithImages = libraryBooks.map(book => ({
            ...book,
            image_url: imageMap.get(book.id) || null
          }));
          
          console.log(`✅ Found ${imageMap.size} cover images for library books`);
        }
      }
    }

    console.log(`🖼️ Library books with images: ${libraryBooksWithImages.filter(b => b.image_url).length}/${libraryBooksWithImages.length}`);

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
