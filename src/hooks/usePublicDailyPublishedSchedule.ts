import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

export const usePublicDailyPublishedSchedule = () => {
  return useQuery({
    queryKey: ['public-daily-published-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          id,
          title,
          description,
          status,
          publish_date,
          published_at,
          expires_at,
          is_active,
          created_at,
          book:books(
            book_name,
            book_description
          )
        `)
        .in('status', ['active', 'queued'])
        .eq('is_active', true)
        .order('publish_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching public daily published schedule:', error);
        throw error;
      }

      const items = (data as DailyPublishedWithBook[]) || [];
      
      // Additional client-side filtering for safety
      const now = new Date();
      
      return items.filter(item => {
        // Show active items (not expired) and queued items
        if (!item.is_active) {
          return false;
        }
        
        // For active items, check expiration
        if (item.status === 'active' && item.expires_at && new Date(item.expires_at) <= now) {
          return false;
        }
        
        // Show both active and queued items
        return item.status === 'active' || item.status === 'queued';
      });
    },
    staleTime: 60 * 1000, // 1 minute - longer cache for public content
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};