import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { isValidUUID } from '@/utils/uuid';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};