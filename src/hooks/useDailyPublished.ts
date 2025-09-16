import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';

export const useDailyPublished = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['daily-published', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching daily published content:', error);
        throw error;
      }

      return data as DailyPublished[] || [];
    },
    enabled: !!bookId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};