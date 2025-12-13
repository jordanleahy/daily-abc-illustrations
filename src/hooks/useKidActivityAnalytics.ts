import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface KidWithActivity {
  kid_id: string;
  kid_name: string;
  parent_user_id: string;
  date_of_birth: string | null;
  total_books_read: number;
  total_completions: number;
  total_reading_sessions: number;
  last_activity_at: string | null;
}

export interface KidReadingActivity {
  activity_id: string;
  book_id: string;
  book_name: string;
  book_category: string | null;
  pages_read: number | null;
  total_pages: number | null;
  reading_completed: boolean | null;
  completion_count: number;
  view_count: number;
  last_viewed_at: string;
  last_reading_session_at: string | null;
  created_at: string;
}

export const useAllKidsWithActivity = () => {
  const queryClient = useQueryClient();

  // Real-time subscription for activity updates
  useEffect(() => {
    const channel = supabase
      .channel('kid-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_book_activity',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kids-with-activity'] });
          queryClient.invalidateQueries({ queryKey: ['kid-reading-activity'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kid_profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kids-with-activity'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['kids-with-activity'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_kids_with_activity');
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        kid_id: row.kid_id,
        kid_name: row.kid_name,
        parent_user_id: row.parent_user_id,
        date_of_birth: row.date_of_birth,
        total_books_read: row.total_books_read || 0,
        total_completions: row.total_completions || 0,
        total_reading_sessions: row.total_reading_sessions || 0,
        last_activity_at: row.last_activity_at,
      })) as KidWithActivity[];
    },
  });
};

export const useKidReadingActivity = (kidId: string | null) => {
  const queryClient = useQueryClient();

  // Real-time subscription for specific kid's reading activity
  useEffect(() => {
    if (!kidId) return;

    const channel = supabase
      .channel(`kid-${kidId}-reading-activity`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_book_activity',
          filter: `kid_id=eq.${kidId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kid-reading-activity', kidId] });
          queryClient.invalidateQueries({ queryKey: ['kids-with-activity'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kidId, queryClient]);

  return useQuery({
    queryKey: ['kid-reading-activity', kidId],
    queryFn: async () => {
      if (!kidId) return [];
      
      const { data, error } = await supabase.rpc('get_kid_reading_activity', { 
        p_kid_id: kidId 
      });
      
      if (error) throw error;
      return (data || []) as KidReadingActivity[];
    },
    enabled: !!kidId,
  });
};
