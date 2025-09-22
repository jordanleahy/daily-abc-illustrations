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
        .order('publish_date', { ascending: true }) // Order by publish date instead of queue position
        .order('created_at', { ascending: true }); // Secondary sort by creation time

      if (error) {
        console.error('Error fetching daily published schedule:', error);
        throw error;
      }

      const items = (data as DailyPublishedWithBook[]) || [];
      
      // Client-side filtering for expired items (for immediate UI responsiveness)
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      return items.filter(item => {
        // Keep items that are not expired based on status and publish_date
        if (item.status === 'expired') {
          return false; // Hide expired items
        }
        
        // For active items, check if they should still be active
        if (item.status === 'active' && item.publish_date < today) {
          console.log(`Client-side detected expired item: ${item.title} (published on ${item.publish_date})`);
          return false; // Hide items that should have expired
        }
        
        return true;
      });
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for schedule
    gcTime: 60 * 1000, // 1 minute
  });
};
