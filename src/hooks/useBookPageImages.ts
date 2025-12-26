import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BookPageImagesResult {
  images: Record<number, string>;
  colorCosts: Record<number, number>;
}

/**
 * Hook to fetch page images from storage for a created book
 * Returns a map of page numbers to image URLs and color generation costs
 */
export const useBookPageImages = (bookId: string | null | undefined) => {
  return useQuery({
    queryKey: ['book-page-images', bookId],
    queryFn: async (): Promise<BookPageImagesResult> => {
      if (!bookId) return { images: {}, colorCosts: {} };

      const { data, error } = await supabase
        .from('page_image_urls')
        .select(`
          id,
          image_url,
          color_generation_cost_cents,
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
      const images: Record<number, string> = {};
      const colorCosts: Record<number, number> = {};
      
      data?.forEach((item: any) => {
        const pageNumber = item.pages?.page_number;
        if (pageNumber !== undefined && pageNumber !== null) {
          if (item.image_url) {
            images[pageNumber] = item.image_url;
          }
          if (item.color_generation_cost_cents) {
            colorCosts[pageNumber] = item.color_generation_cost_cents;
          }
        }
      });

      return { images, colorCosts };
    },
    enabled: !!bookId,
  });
};
