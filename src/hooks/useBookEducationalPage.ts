import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';

/**
 * Hook to fetch the educational focus page for a book
 * Returns the educational page (page_type='educational') or null
 */
export const useBookEducationalPage = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['book-educational-page', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .eq('page_type', 'educational')
        .maybeSingle();

      if (error) {
        console.error('Error fetching educational page:', error);
        return null;
      }

      return data as Page | null;
    },
    enabled: !!bookId,
  });
};
