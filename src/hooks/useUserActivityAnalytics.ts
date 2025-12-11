import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserWithActivity {
  user_id: string;
  user_email: string | null;
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
  const queryClient = useQueryClient();

  // Real-time subscription for user activity updates
  useEffect(() => {
    const channel = supabase
      .channel('user-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_book_activity',
        },
        () => {
          // Invalidate queries when any reading progress is updated
          queryClient.invalidateQueries({ queryKey: ['users-with-activity'] });
          queryClient.invalidateQueries({ queryKey: ['user-reading-activity'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['users-with-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_all_users_with_activity');
      
      if (error) throw error;
      
      // Map database columns to interface properties
      return (data || []).map((row: any) => ({
        user_id: row.user_id,
        user_email: row.user_email,
        user_name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown User',
        total_books_accessed: row.books_accessed || 0,
        total_reading_sessions: row.reading_sessions || 0,
        last_activity_at: row.last_activity,
        kids_count: row.kids_count || 0,
      })) as UserWithActivity[];
    },
  });
};

export const useUserReadingActivity = (userId: string | null) => {
  const queryClient = useQueryClient();

  // Real-time subscription for specific user's reading activity
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-${userId}-reading-activity`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_book_activity',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate this user's reading activity when their progress updates
          queryClient.invalidateQueries({ queryKey: ['user-reading-activity', userId] });
          queryClient.invalidateQueries({ queryKey: ['users-with-activity'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

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
