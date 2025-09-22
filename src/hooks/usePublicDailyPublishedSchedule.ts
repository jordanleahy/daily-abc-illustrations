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
        // Show active items that are not expired
        if (item.status === 'active') {
          return item.is_active && (!item.expires_at || new Date(item.expires_at) > now);
        }
        
        // Show queued items regardless of is_active status
        if (item.status === 'queued') {
          return true;
        }
        
        return false;
      });
    },
    staleTime: 60 * 1000, // 1 minute - longer cache for public content
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};