import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';

export const useInstagramSharedPagesPublic = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['instagram-shared-pages-public', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .rpc('get_instagram_shared_pages', { p_book_id: bookId });

      if (error) {
        console.error('Error fetching instagram shared pages (public):', error);
        throw error;
      }

      return data as Page[] || [];
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};