import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to fetch TODAY'S habit completions (the actual checklist).
 * Uses the habit_completions table which tracks all habits added to today's checklist.
 * 
 * This is the SOURCE OF TRUTH for what habits are on today's list and their status.
 * Use this hook to display current checklist items and check if habits are already added.
 * 
 * @param kidProfileId - Optional kid profile ID to filter habits to a specific child
 * @returns Array of habit completions with full details (habit info, kid info, status)
 */
export function useTodayHabits(kidProfileId?: string) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  // Real-time subscription for habit completions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('habit-completions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_completions',
          filter: `parent_user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Habit completion changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['today-habits', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['today-habits', user?.id, kidProfileId, todayDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('habit_completions')
        .select(`
          *,
          habit_assignments!inner(
            habit_id,
            kid_profile_id,
            habits!inner(
              id,
              parent_user_id,
              title,
              description,
              photo_url,
              coin_amount,
              frequency,
              deadline_time,
              book_id,
              is_active,
              display_order,
              created_at,
              updated_at
            ),
            kid_profiles!inner(
              id,
              first_name,
              last_name,
              profile_image_url,
              earned_coins
            )
          )
        `)
        .eq('parent_user_id', user.id)
        .eq('completion_date', todayDate)
        .order('created_at', { ascending: true });

      // Filter by specific kid if provided
      if (kidProfileId) {
        query = query.eq('kid_profile_id', kidProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HabitCompletionWithDetails[];
    },
    enabled: !!user?.id,
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches (realtime handles updates)
  });
}
