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
        .eq('status', 'active')
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
        // Only show items that are active and not expired
        if (item.status !== 'active' || !item.is_active) {
          return false;
        }
        
        // Check expiration
        if (item.expires_at && new Date(item.expires_at) <= now) {
          return false;
        }
        
        return true;
      });
    },
    staleTime: 60 * 1000, // 1 minute - longer cache for public content
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};