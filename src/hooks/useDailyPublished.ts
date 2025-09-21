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
      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active daily published content:', error);
        throw error;
      }

      return data as DailyPublished | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};