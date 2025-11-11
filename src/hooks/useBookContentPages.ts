import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';

/**
 * Hook to fetch only content pages for a book
 * Returns all pages with page_type='content', excluding cover and educational pages
 */
export const useBookContentPages = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['book-content-pages', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .eq('page_type', 'content')
        .order('page_number', { ascending: true });

      if (error) {
        console.error('Error fetching content pages:', error);
        throw error;
      }

      return data as Page[];
    },
    enabled: !!bookId,
  });
};
