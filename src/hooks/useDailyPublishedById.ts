import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';

export const useDailyPublishedById = (id: string | undefined) => {
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
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (activeError) {
        console.error('Error fetching daily published content by id:', activeError);
        throw activeError;
      }

      if (activeData) {
        return { data: activeData as DailyPublished, isExpired: false };
      }

      // If no active content, check if expired content exists
      const { data: expiredData, error: expiredError } = await supabase
        .from('daily_published')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (expiredError) {
        console.error('Error checking for expired content:', expiredError);
        throw expiredError;
      }

      // If content exists but is not active, it's expired
      if (expiredData) {
        return { data: null, isExpired: true };
      }

      // Content doesn't exist at all
      return { data: null, isExpired: false };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};