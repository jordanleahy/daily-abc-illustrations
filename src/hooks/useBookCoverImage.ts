import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch the cover image for a book with fallback support
 * 
 * Priority order:
 * 1. Image from page with page_type = 'cover'
 * 2. Book's thumbnail_url field
 * 3. null (shows placeholder)
 * 
 * Returns the image URL or null
 */
export const useBookCoverImage = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['book-cover-image', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // Priority 1: Look for page_type = 'cover' image
      const { data: coverData, error: coverError } = await supabase
        .from('page_image_urls')
        .select(`
          image_url,
          pages!inner(
            page_number,
            page_type
          )
        `)
        .eq('book_id', bookId)
        .eq('pages.page_type', 'cover')
        .eq('is_latest', true)
        .not('image_url', 'is', null)
        .limit(1)
        .maybeSingle();

      if (coverError) {
        console.error('Error fetching book cover image:', coverError);
      }

      // If we found a cover page image, return it
      if (coverData?.image_url) {
        return coverData.image_url;
      }

      // Priority 2: Fallback to book's thumbnail_url
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('thumbnail_url')
        .eq('id', bookId)
        .maybeSingle();

      if (bookError) {
        console.error('Error fetching book thumbnail:', bookError);
        return null;
      }

      return bookData?.thumbnail_url || null;
    },
    enabled: !!bookId,
  });
};
