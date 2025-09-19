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

      // Find the current active item's published_at time or calculate from queue
      const activeItem = queueItems.find(item => item.status === 'active');
      let baseTime: Date;

      if (activeItem && activeItem.published_at) {
        // If there's an active item, calculate from when it expires (24 hours after published_at)
        baseTime = new Date(activeItem.published_at);
        baseTime.setHours(baseTime.getHours() + 24);
      } else {
        // If no active item, start from now
        baseTime = new Date();
      }

      // Calculate position in queue (subtract 1 because this is the next position)
      const queuedItems = queueItems.filter(item => item.status === 'queued').length;
      const positionsAhead = queuedItems; // This book would be after all currently queued items

      // Each position adds 24 hours
      const expectedDate = new Date(baseTime);
      expectedDate.setHours(expectedDate.getHours() + (positionsAhead * 24));

      return expectedDate;
    },
    enabled: !queueLoading && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};