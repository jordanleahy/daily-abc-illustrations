import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

interface PageImage {
  page_id: string;
  letter: string;
  page_number: number;
  image_url: string;
}

interface RequestBody {
  dailyPublishedId?: string;
  bookId?: string;
}

Deno.serve(createHandler({
  name: 'get-daily-published-images',
  clientMode: 'public',
  requireAuth: false,
  methods: ['POST'],
}, async ({ supabase, req }) => {
  const { dailyPublishedId, bookId } = await parseBody<RequestBody>(req);

  if (!dailyPublishedId && !bookId) {
    return errors.badRequest('Either dailyPublishedId or bookId is required');
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
      return errors.notFound('Daily published content not found');
    }

    // Check if content is still active
    if (!dpData.is_active || (dpData.expires_at && new Date(dpData.expires_at) < new Date())) {
      return errors.notFound('Content has expired');
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
    throw pagesError;
  }

  if (!pages || pages.length === 0) {
    console.log('No pages found for book');
    return successResponse({ error: 'No pages found', images: [] });
  }

  // Fetch all latest complete images for these pages in one query
  const pageIds = pages.map(p => p.id);
  const { data: imageUrls, error: imagesError } = await supabase
    .from('page_image_urls')
    .select('page_id, image_url')
    .in('page_id', pageIds)
    .eq('is_latest', true)
    .not('image_url', 'is', null);

  if (imagesError) {
    console.error('Error fetching images:', imagesError);
    throw imagesError;
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
      };
    });

  // Return with cache headers (handled by the caller if needed)
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, max-age=3600',
        'Vercel-CDN-Cache-Control': 'public, max-age=3600',
      },
    }
  );
}));
