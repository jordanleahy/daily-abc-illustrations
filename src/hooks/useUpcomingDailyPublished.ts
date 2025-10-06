import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

export const useUpcomingDailyPublished = (limit = 5) => {
  return useQuery({
    queryKey: ['upcoming-daily-published', limit],
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
        .eq('status', 'queued') // Only queued items
        .order('publish_date', { ascending: true }) // Order by publish date chronologically
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming daily published:', error);
        throw error;
      }

      return (data as DailyPublishedWithBook[]) || [];
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};