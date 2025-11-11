import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';

/**
 * Hook to fetch the cover page for a book
 * Returns the cover page (page_type='cover') or null
 */
export const useBookCoverPage = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['book-cover-page', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .eq('page_type', 'cover')
        .maybeSingle();

      if (error) {
        console.error('Error fetching cover page:', error);
        return null;
      }

      return data as Page | null;
    },
    enabled: !!bookId,
  });
};
