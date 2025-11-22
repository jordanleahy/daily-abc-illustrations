import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserWithActivity {
  user_id: string;
  user_name: string;
  total_books_accessed: number;
  total_reading_sessions: number;
  last_activity_at: string;
  kids_count: number;
}

export interface UserReadingActivity {
  activity_id: string;
  book_id: string;
  book_name: string;
  book_category: string | null;
  kid_id: string | null;
  kid_name: string;
  pages_read: number | null;
  total_pages: number | null;
  reading_completed: boolean | null;
  view_count: number;
  last_viewed_at: string;
  last_reading_session_at: string | null;
  created_at: string;
}

export const useAllUsersWithActivity = () => {
  return useQuery({
    queryKey: ['users-with-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_all_users_with_activity');
      
      if (error) throw error;
      return data as UserWithActivity[];
    },
  });
};

export const useUserReadingActivity = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-reading-activity', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_reading_activity', { p_user_id: userId });
      
      if (error) throw error;
      return data as UserReadingActivity[];
    },
    enabled: !!userId,
  });
};
