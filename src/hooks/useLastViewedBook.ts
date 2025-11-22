import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LastViewedBook {
  id: string;
  book_name: string;
  book_description: string | null;
  last_viewed_at: string;
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
        .select('book_id, daily_published_id, last_viewed_at')
        .eq('kid_id', kidProfileId)
        .order('last_viewed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activityError) {
        console.error('Error fetching last viewed book activity:', activityError);
        return null;
      }

      if (!activity) return null;

      // Get the book details
      let bookId = activity.book_id;

      // If the activity was for a daily published book, get the book_id from that
      if (!bookId && activity.daily_published_id) {
        const { data: dailyPublished, error: dpError } = await supabase
          .from('daily_published')
          .select('book_id')
          .eq('id', activity.daily_published_id)
          .single();

        if (dpError) {
          console.error('Error fetching daily published book:', dpError);
          return null;
        }

        bookId = dailyPublished?.book_id;
      }

      if (!bookId) return null;

      // Fetch the book details
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, book_name, book_description')
        .eq('id', bookId)
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
