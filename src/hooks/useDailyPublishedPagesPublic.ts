import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';

export const useDailyPublishedPagesPublic = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['daily-published-pages-public', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .rpc('get_daily_published_pages', { p_book_id: bookId });

      if (error) {
        console.error('Error fetching daily published pages (public):', error);
        throw error;
      }

      return data as Page[] || [];
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};