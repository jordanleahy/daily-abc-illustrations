import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch page images from storage for a created book
 * Returns a map of page numbers to image URLs
 */
export const useBookPageImages = (bookId: string | null | undefined) => {
  return useQuery({
    queryKey: ['book-page-images', bookId],
    queryFn: async () => {
      if (!bookId) return {};

      const { data, error } = await supabase
        .from('page_image_urls')
        .select(`
          id,
          image_url,
          pages!inner(
            page_number
          )
        `)
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .not('image_url', 'is', null)
        .order('pages(page_number)', { ascending: true });

      if (error) {
        console.error('Error fetching book images:', error);
        throw error;
      }

      // Transform to Record<number, string> for easy lookup
      const imageMap: Record<number, string> = {};
      data?.forEach((item: any) => {
        if (item.image_url && item.pages?.page_number) {
          imageMap[item.pages.page_number] = item.image_url;
        }
      });

      return imageMap;
    },
    enabled: !!bookId,
  });
};
