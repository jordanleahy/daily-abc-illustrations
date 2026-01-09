import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PrintableImageData {
  page_id: string;
  page_number: number;
  letter: string;
  printable_coloring_image_url: string;
}

export function usePublicBookPrintableImages(bookId: string | undefined) {
  return useQuery({
    queryKey: ['public-book-printable-images', bookId],
    queryFn: async (): Promise<PrintableImageData[]> => {
      if (!bookId) return [];

      // Get pages for the book
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id, page_number, letter')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (pagesError || !pages) return [];

      // Get printable coloring images for each page
      const printableImages: PrintableImageData[] = [];
      
      for (const page of pages) {
        const { data: imageData } = await supabase
          .from('page_image_urls')
          .select('printable_coloring_image_url')
          .eq('page_id', page.id)
          .eq('is_latest', true)
          .not('printable_coloring_image_url', 'is', null)
          .maybeSingle();

        if (imageData?.printable_coloring_image_url) {
          printableImages.push({
            page_id: page.id,
            page_number: page.page_number,
            letter: page.letter,
            printable_coloring_image_url: imageData.printable_coloring_image_url
          });
        }
      }

      return printableImages;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
