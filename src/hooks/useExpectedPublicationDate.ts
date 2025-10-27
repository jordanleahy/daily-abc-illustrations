import { useDailyPublishedQueue } from './useDailyPublishedQueue';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { createEasternPublishDate } from '@/utils/timezone';
import { getAppendPublishDate } from '@/utils/publishQueue';

export const useExpectedPublicationDate = (contentId: string) => {
  const { data: queueItems = [], isLoading: queueLoading } = useDailyPublishedQueue();

  return useQuery({
    queryKey: ['expected-publication-date', contentId],
    queryFn: async () => {
      // Get next publish date (appends to end of queue - FIFO)
      const nextDate = await getAppendPublishDate(supabase);
      
      if (!nextDate) {
        return null;
      }

      // Create publish date at 7:01 AM Eastern Time for the given date
      // Use proper timezone conversion to get the correct UTC time
      const publishDate = createEasternPublishDate(nextDate);
      
      return publishDate;
    },
    enabled: !queueLoading && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};