import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { isValidUUID } from '@/utils/uuid';
import { useDailyPublishedSubscription } from './useDailyPublishedSubscription';

export const useDailyPublishedById = (id: string | undefined) => {
  // Enable real-time subscriptions
  useDailyPublishedSubscription();
  
  return useQuery({
    queryKey: ['daily-published', id],
    queryFn: async () => {
      if (!id) return { data: null, isExpired: false };
      
      // First, try to get active content
      const { data: activeData, error: activeError } = await supabase
        .from('daily_published')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .eq('status', 'active')
        .maybeSingle();

      if (activeError) {
        console.error('Error fetching daily published content by id:', activeError);
        throw activeError;
      }

      if (activeData) {
        return { data: activeData as DailyPublished, isExpired: false };
      }

      // If no active content found and the ID looks like a valid UUID,
      // assume it's expired content for non-auth users (since RLS blocks expired content access)
      // This handles the common case where users visit expired links
      if (isValidUUID(id)) {
        return { data: null, isExpired: true };
      }

      // If ID is malformed, it truly doesn't exist
      return { data: null, isExpired: false };
    },
    enabled: !!id,
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches (realtime handles updates)
  });
};