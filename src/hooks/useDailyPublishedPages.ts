import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';
import { queryKeys } from '@/hooks/queryKeys';

export const useDailyPublishedPages = (bookId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.pages.byBook(bookId || ''),
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
    staleTime: 60 * 60 * 1000, // 1 hour - instant loading for returning users
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for full day
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
};