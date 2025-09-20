import { useDailyPublishedQueue } from './useDailyPublishedQueue';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useExpectedPublicationDate = (contentId: string) => {
  const { data: queueItems = [], isLoading: queueLoading } = useDailyPublishedQueue();

  return useQuery({
    queryKey: ['expected-publication-date', contentId],
    queryFn: async () => {
      // Get next queue position
      const { data: nextPosition } = await supabase.rpc('get_next_queue_position');
      
      if (!nextPosition) {
        return null;
      }

      // Use fixed daily schedule (11:12 PM UTC)
      // Calculate the activation time for this position
      const { data: activationTime } = await supabase.rpc('calculate_fixed_schedule_time', {
        queue_pos: nextPosition
      });

      return activationTime ? new Date(activationTime) : null;
    },
    enabled: !queueLoading && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};