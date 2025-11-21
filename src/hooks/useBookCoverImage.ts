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

      // First get the cover page ID
      const { data: coverPage, error: pageError } = await supabase
        .from('pages')
        .select('id')
        .eq('book_id', bookId)
        .eq('page_type', 'cover')
        .maybeSingle();

      if (pageError) {
        console.error('Error fetching cover page:', pageError);
        return null;
      }

      if (!coverPage) return null;

      // Then get the latest image for that page
      const { data, error } = await supabase
        .from('page_image_urls')
        .select('image_url')
        .eq('page_id', coverPage.id)
        .eq('is_latest', true)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
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
