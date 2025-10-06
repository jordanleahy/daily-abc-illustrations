import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

export const useDailyPublishedSchedule = () => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['daily-published-schedule'],
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
        .neq('status', 'draft') // Filter out draft entries
        .order('publish_date', { ascending: true }) // Order by publish date chronologically
        .order('created_at', { ascending: true }); // Secondary sort by creation time

      if (error) {
        console.error('Error fetching daily published schedule:', error);
        throw error;
      }

      return (data as DailyPublishedWithBook[]) || [];
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for schedule
    gcTime: 60 * 1000, // 1 minute
  });
};
