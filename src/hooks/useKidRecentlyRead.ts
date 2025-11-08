import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

interface UserBookActivity {
  id: string;
  user_id: string;
  daily_published_id: string;
  kid_id: string | null;
  last_reading_session_at: string | null;
  pages_read: number;
  reading_completed: boolean;
  view_count: number;
  last_viewed_at: string;
  created_at: string;
  updated_at: string;
  daily_published: DailyPublishedWithBook;
}

/**
 * Fetches the last 10 books that a specific kid has actually read (not just clicked)
 * Filters by last_reading_session_at to ensure we only show books they went through in reading mode
 */
export function useKidRecentlyRead(kidId: string | undefined) {
  return useQuery({
    queryKey: ['kid-recently-read', kidId],
    queryFn: async (): Promise<DailyPublishedWithBook[]> => {
      if (!kidId) return [];
      
      const { data, error } = await supabase
        .from('user_book_activity')
        .select(`
          *,
          daily_published:daily_published_id (
            *,
            book:book_id (
              book_name,
              book_description,
              user_id
            )
          )
        `)
        .eq('kid_id', kidId)
        .not('last_reading_session_at', 'is', null)
        .order('last_reading_session_at', { ascending: false })
        .limit(10)
        .returns<UserBookActivity[]>();
      
      if (error) {
        console.error('Error fetching kid recently read books:', error);
        throw error;
      }
      
      // Extract and return the daily_published objects
      return data
        ?.map(activity => activity.daily_published)
        .filter((book): book is DailyPublishedWithBook => book !== null) || [];
    },
    enabled: !!kidId,
    staleTime: 1000 * 60, // 1 minute - fresh data for recent reads
  });
}
