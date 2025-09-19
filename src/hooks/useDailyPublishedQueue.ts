import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

export const useDailyPublishedQueue = () => {
  return useQuery({
    queryKey: ['daily-published-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            book_name,
            book_description,
            user_id
          )
        `)
         .neq('status', 'draft') // Filter out draft entries from public queue view
         .order('queue_position', { ascending: true });

      if (error) {
        console.error('Error fetching daily published queue:', error);
        throw error;
      }

      return (data as DailyPublishedWithBook[]) || [];
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for queue
    gcTime: 60 * 1000, // 1 minute
  });
};