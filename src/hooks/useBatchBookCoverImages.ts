import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Batch fetch cover images for multiple books
 * Reduces N×2 queries to just 2 queries total
 * 
 * Query 1: Get all cover page IDs for the book IDs
 * Query 2: Get all latest images for those cover pages
 */
export const useBatchBookCoverImages = (bookIds: string[]) => {
  return useQuery({
    queryKey: ['book-cover-images-batch', bookIds.sort().join(',')],
    queryFn: async () => {
      if (!bookIds || bookIds.length === 0) {
        return {};
      }

      // Step 1: Get all cover pages for these books
      const { data: coverPages, error: pagesError } = await supabase
        .from('pages')
        .select('id, book_id')
        .in('book_id', bookIds)
        .eq('page_type', 'cover');

      if (pagesError) {
        console.error('Error fetching cover pages:', pagesError);
        return {};
      }

      if (!coverPages || coverPages.length === 0) {
        return {};
      }

      // Create map of pageId → bookId for reverse lookup
      const pageToBookMap: Record<string, string> = {};
      coverPages.forEach(page => {
        pageToBookMap[page.id] = page.book_id;
      });

      const coverPageIds = coverPages.map(p => p.id);

      // Step 2: Get latest images for all cover pages
      const { data: images, error: imagesError } = await supabase
        .from('page_image_urls')
        .select('page_id, image_url')
        .in('page_id', coverPageIds)
        .eq('is_latest', true)
        .not('image_url', 'is', null);

      if (imagesError) {
        console.error('Error fetching cover images:', imagesError);
        return {};
      }

      // Build bookId → imageUrl map
      const coverImageMap: Record<string, string> = {};
      images?.forEach(image => {
        const bookId = pageToBookMap[image.page_id];
        if (bookId && image.image_url) {
          coverImageMap[bookId] = image.image_url;
        }
      });

      return coverImageMap;
    },
    enabled: bookIds.length > 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
