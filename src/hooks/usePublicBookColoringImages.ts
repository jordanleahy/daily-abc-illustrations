import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ColoringImageData {
  page_id: string;
  page_number: number;
  letter: string;
  coloring_image_url: string;
}

export function usePublicBookColoringImages(bookId: string | undefined) {
  return useQuery({
    queryKey: ['public-book-coloring-images', bookId],
    queryFn: async (): Promise<ColoringImageData[]> => {
      if (!bookId) return [];

      // Get pages for the book
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id, page_number, letter')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (pagesError || !pages) return [];

      // Get coloring images for each page
      const coloringImages: ColoringImageData[] = [];
      
      for (const page of pages) {
        const { data: imageData } = await supabase
          .from('page_image_urls')
          .select('coloring_image_url')
          .eq('page_id', page.id)
          .eq('is_latest', true)
          .not('coloring_image_url', 'is', null)
          .maybeSingle();

        if (imageData?.coloring_image_url) {
          coloringImages.push({
            page_id: page.id,
            page_number: page.page_number,
            letter: page.letter,
            coloring_image_url: imageData.coloring_image_url
          });
        }
      }

      return coloringImages;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
