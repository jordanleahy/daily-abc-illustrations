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
        .eq('status', 'active')
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
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches (realtime handles updates)
  });
};