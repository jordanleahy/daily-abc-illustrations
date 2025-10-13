import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { useDailyPublishedSubscription } from './useDailyPublishedSubscription';
import { isValidUUID } from '@/utils/uuid';

export const useLibraryBookById = (id: string | undefined) => {
  // Enable real-time subscriptions
  useDailyPublishedSubscription();
  
  return useQuery({
    queryKey: ['library-book', id],
    queryFn: async () => {
      if (!id || !isValidUUID(id)) {
        console.warn('useLibraryBookById: Invalid id provided, skipping query', id);
        return null;
      }
      
      // For authenticated users, get any daily published content they own (regardless of status)
      // RLS policies will ensure users can only see their own content
      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            total_pages
          )
        `)
        .eq('id', id)
        .maybeSingle();

      console.log('useLibraryBookById: Query result:', { data, error });

      if (error) {
        console.error('Error fetching library book by id:', error);
        throw error;
      }

      return data as DailyPublished | null;
    },
    enabled: !!id && isValidUUID(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};