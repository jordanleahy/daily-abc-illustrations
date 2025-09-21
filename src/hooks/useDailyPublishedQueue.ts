import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

export const useDailyPublishedQueue = () => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
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

      const items = (data as DailyPublishedWithBook[]) || [];
      
      // Client-side filtering for expired items (for immediate UI responsiveness)
      const now = new Date();
      return items.filter(item => {
        // Keep items that are not expired based on expires_at timestamp
        if (item.expires_at) {
          const expiresAt = new Date(item.expires_at);
          if (now > expiresAt && item.status !== 'expired') {
            // Item should be expired but isn't marked as such in DB yet
            console.log(`Client-side detected expired item: ${item.title} (expired at ${item.expires_at})`);
            return false; // Hide from UI immediately
          }
        }
        
        // Also hide items already marked as expired in the database
        return item.status !== 'expired';
      });
    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for queue
    gcTime: 60 * 1000, // 1 minute
  });
};