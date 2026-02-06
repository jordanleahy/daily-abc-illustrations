import { createHandler } from '../_shared/handler.ts';
import { successResponse } from '../_shared/response.ts';
import { toZonedTime, format } from 'https://esm.sh/date-fns-tz@3';

function getTodayEastern(): string {
  const now = new Date();
  const easternTime = toZonedTime(now, 'America/New_York');
  return format(easternTime, 'yyyy-MM-dd');
}

Deno.serve(createHandler({
  name: 'get-landing-page-data',
  clientMode: 'service',
  requireAuth: false,
  methods: ['GET', 'POST'],
}, async ({ supabase }) => {
  const todayEastern = getTodayEastern();
  console.log('🚀 Starting landing page data fetch for date:', todayEastern);
  const startTime = Date.now();

  // Execute all queries in parallel for maximum performance
  console.log('📊 Step 1: Fetching core data (daily published, popular books, library books)...');
  const [dailyPublishedResult, popularBooksResult, libraryBooksResult] = await Promise.all([
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
  ]);

  console.log('✅ Step 1 complete:', {
    dailyPublished: !!dailyPublishedResult.data,
    popularBooksCount: popularBooksResult.data?.length || 0,
    libraryBooksCount: libraryBooksResult.data?.length || 0
  });

  if (dailyPublishedResult.error) throw dailyPublishedResult.error;
  if (popularBooksResult.error) throw popularBooksResult.error;
  if (libraryBooksResult.error) throw libraryBooksResult.error;

  const dailyPublished = dailyPublishedResult.data;
  const popularBooks = popularBooksResult.data || [];
  const libraryBooks = libraryBooksResult.data || [];

  console.log('📊 Step 2: Fetching pages and SEO metadata in parallel...');

  let dailyPublishedWithPages = null;
  const popularBookIds = popularBooks.map(b => b.id);
  const libraryBookIds = libraryBooks.map(lb => lb.id);

  const pagesPromise = dailyPublished?.book_id
    ? (async () => {
        console.log('  📄 Fetching pages for daily published book:', dailyPublished.book_id);
        
        const pagesResult = await supabase
          .from('pages')
          .select('id, letter, page_number, title, description')
          .eq('book_id', dailyPublished.book_id)
          .order('page_number', { ascending: true })
          .limit(3);

        if (pagesResult.error) return { data: null, error: pagesResult.error };
        if (!pagesResult.data || pagesResult.data.length === 0) return { data: [], error: null };

        console.log(`  ✅ Found ${pagesResult.data.length} pages, fetching images...`);

        const pageIds = pagesResult.data.map(p => p.id);
        const imagesResult = await supabase
          .from('page_image_urls')
          .select('page_id, image_url, is_latest')
          .in('page_id', pageIds)
          .eq('is_latest', true)
          .not('image_url', 'is', null);

        if (imagesResult.error) {
          return { data: pagesResult.data.map(p => ({ ...p, image_url: null })), error: null };
        }

        const imageMap = new Map(imagesResult.data?.map(img => [img.page_id, img.image_url]) || []);
        const pagesWithImages = pagesResult.data.map(page => ({
          ...page,
          image_url: imageMap.get(page.id) || null
        }));

        return { data: pagesWithImages, error: null };
      })()
    : Promise.resolve({ data: null, error: null });

  const seoPromise = Promise.resolve({ data: [], error: null });

  const popularBookThumbnailsPromise = popularBookIds.length > 0
    ? (async () => {
        console.log('  🎨 Fetching thumbnails for', popularBookIds.length, 'popular books...');
        
        const dpResult = await supabase
          .from('daily_published')
          .select('id, book_id, status')
          .in('book_id', popularBookIds)
          .order('created_at', { ascending: false });
        
        const bookToDpMap = new Map();
        if (dpResult.data) {
          dpResult.data.forEach(dp => {
            if (!bookToDpMap.has(dp.book_id)) {
              bookToDpMap.set(dp.book_id, dp.id);
            }
          });
        }
        
        const dpIds = Array.from(bookToDpMap.values());
        
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
            seoResult.data.forEach(seo => {
              const bookId = Array.from(bookToDpMap.entries())
                .find(([, dpId]) => dpId === seo.daily_published_id)?.[0];
              if (bookId) {
                seoThumbnailMap.set(bookId, seo.og_image_url);
              }
            });
          }
        }
        
        const booksNeedingFallback = popularBookIds.filter(id => !seoThumbnailMap.has(id));
        
        if (booksNeedingFallback.length > 0) {
          console.log(`  🔄 Falling back to page images for ${booksNeedingFallback.length} books`);
          const pagesResult = await supabase
            .from('pages')
            .select('id, book_id, page_number')
            .in('book_id', booksNeedingFallback)
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

  if (pagesError) console.error('⚠️ Pages fetch had error, but continuing:', pagesError);
  if (seoError) console.error('⚠️ SEO metadata fetch had error, but continuing:', seoError);

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

  const seoMap = !seoError && seoMetadata
    ? new Map(seoMetadata.map((s: any) => [s.daily_published_id, { og_image_url: s.og_image_url, seo_title: s.seo_title }]))
    : new Map();

  const popularThumbnailMap = popularThumbnailsResult.data || new Map();
  const popularBooksWithImages = popularBooks.map(book => ({
    ...book,
    image_url: popularThumbnailMap.get(book.id) || null
  }));

  console.log(`🎨 Popular books with images: ${popularBooksWithImages.filter(b => b.image_url).length}/${popularBooks.length}`);

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
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      } 
    }
  );
}));
