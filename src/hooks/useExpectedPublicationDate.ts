import { useDailyPublishedQueue } from './useDailyPublishedQueue';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { createEasternPublishDate } from '@/utils/timezone';

export const useExpectedPublicationDate = (contentId: string) => {
  const { data: queueItems = [], isLoading: queueLoading } = useDailyPublishedQueue();

  return useQuery({
    queryKey: ['expected-publication-date', contentId],
    queryFn: async () => {
      // Get next available publish date
      const { data: nextDate } = await supabase.rpc('get_next_available_publish_date');
      
      if (!nextDate) {
        return null;
      }

      // Convert date to publication time (7:01 AM Eastern Time)
      const publishDate = createEasternPublishDate(nextDate);
      
      return publishDate;
    },
    enabled: !queueLoading && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};