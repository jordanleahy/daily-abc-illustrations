import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InstagramShared } from '@/types/instagramShared';

export const useInstagramShared = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['instagram-shared', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .from('instagram_shared')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching instagram shared content:', error);
        throw error;
      }

      return data as InstagramShared[] || [];
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};