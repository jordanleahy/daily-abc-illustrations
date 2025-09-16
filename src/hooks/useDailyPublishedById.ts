import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';

export const useDailyPublishedById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['daily-published', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error fetching daily published content by id:', error);
        throw error;
      }

      return data as DailyPublished | null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};