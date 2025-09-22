import { useDailyPublishedQueue } from './useDailyPublishedQueue';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

      // Create publish date at 7:01 AM for the given date
      // Note: The actual timezone conversion is handled by the backend
      const publishDate = new Date(nextDate + 'T07:01:00');
      
      return publishDate;
    },
    enabled: !queueLoading && !!contentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};