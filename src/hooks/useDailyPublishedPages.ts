import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';

export const useDailyPublishedPages = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['daily-published-pages', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (error) {
        console.error('Error fetching daily published pages:', error);
        throw error;
      }

      return data as Page[] || [];
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};