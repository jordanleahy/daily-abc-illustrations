import { useDailyPublishedQueue } from './useDailyPublishedQueue';
import { useQuery } from '@tanstack/react-query';
import { getPublishDateForPosition } from '@/utils/queueDateUtils';

/**
 * Hook to get the expected publication date for a new item added to the queue.
 * Uses position-based calculation: new items go at the end of the queue.
 */
export const useExpectedPublicationDate = (contentId: string) => {
  const { data: queueItems = [], isLoading: queueLoading } = useDailyPublishedQueue();

  return useQuery({
    queryKey: ['expected-publication-date', contentId],
    queryFn: async () => {
      // Count queued items to determine position for new item
      const queuedCount = queueItems.filter(item => item.status === 'queued').length;
      
      // New item would be at position queuedCount + 1
      const nextPosition = queuedCount + 1;
      
      // Calculate the publish date based on position
      const publishDate = getPublishDateForPosition(nextPosition);
      
      return publishDate;
    },
    enabled: !queueLoading && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
