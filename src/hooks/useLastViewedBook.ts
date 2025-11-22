import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LastViewedBook {
  id: string;
  book_name: string;
  book_description: string | null;
  last_viewed_at: string;
  is_library_book: boolean | null;
}

/**
 * Hook to fetch the most recently viewed book for a kid profile
 * @param kidProfileId - The kid profile ID
 * @returns Query result with the last viewed book data
 */
export const useLastViewedBook = (kidProfileId: string | undefined) => {
  return useQuery({
    queryKey: ['last-viewed-book', kidProfileId],
    queryFn: async (): Promise<LastViewedBook | null> => {
      if (!kidProfileId) return null;

      // Query user_book_activity to find the most recently viewed book
      const { data: activity, error: activityError } = await supabase
        .from('user_book_activity')
        .select('book_id, last_viewed_at')
        .eq('kid_id', kidProfileId)
        .order('last_viewed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activityError) {
        console.error('Error fetching last viewed book activity:', activityError);
        return null;
      }

      if (!activity || !activity.book_id) return null;

      // Fetch the book details
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, book_name, book_description, is_library_book')
        .eq('id', activity.book_id)
        .single();

      if (bookError) {
        console.error('Error fetching book details:', bookError);
        return null;
      }

      return {
        ...book,
        last_viewed_at: activity.last_viewed_at,
      };
    },
    enabled: !!kidProfileId,
  });
};
