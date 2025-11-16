import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch the cover image for a book
 * Returns the image URL from the page with page_type = 'cover' or null
 */
export const useBookCoverImage = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['book-cover-image', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching book cover image:', error);
        return null;
      }

      return data?.image_url || null;
    },
    enabled: !!bookId,
  });
};
