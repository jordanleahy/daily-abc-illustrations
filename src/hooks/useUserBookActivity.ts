import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserBookActivity {
  id: string;
  user_id: string;
  daily_published_id: string | null;
  book_id: string | null;
  last_viewed_at: string;
  view_count: number;
  daily_published?: {
    title: string;
    slug: string | null;
  } | null;
  book?: {
    book_name: string;
  } | null;
}

/**
 * Hook to fetch the last N book activities for the current user
 */
export const useUserBookActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: ['user-book-activity', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_book_activity')
        .select(`
          id,
          user_id,
          daily_published_id,
          book_id,
          last_viewed_at,
          view_count,
          daily_published:daily_published_id (
            title,
            slug
          ),
          book:book_id (
            book_name
          )
        `)
        .eq('user_id', user.id)
        .order('last_viewed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user book activity:', error);
        throw error;
      }

      return data as UserBookActivity[];
    },
    staleTime: 30 * 1000, // 30 seconds - keep fresh for navigation
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
