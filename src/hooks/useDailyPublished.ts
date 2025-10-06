import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { useDailyPublishedSubscription } from './useDailyPublishedSubscription';

export const useDailyPublished = () => {
  // Enable real-time subscriptions
  useDailyPublishedSubscription();
  
  return useQuery({
    queryKey: ['daily-published'],
    queryFn: async () => {
      console.log('useDailyPublished: Starting query');
      
      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('publish_date', { ascending: true }) // Order by publish date chronologically
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('useDailyPublished: Error fetching active daily published content:', error);
        throw error;
      }

      console.log('useDailyPublished: Query result:', data);
      return data as DailyPublished | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};