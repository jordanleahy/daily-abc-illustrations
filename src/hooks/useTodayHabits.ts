import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { HabitCompletionWithDetails } from '@/types/habit';
import { SafeLocalStorage, TODAY_HABITS_CACHE_KEY, TODAY_HABITS_CACHE_HOURS } from '@/utils/storage';

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

  // Generate cache key including user, kid, and date
  const cacheKey = useMemo(() => {
    if (!user?.id) return null;
    return `${TODAY_HABITS_CACHE_KEY}_${user.id}_${kidProfileId || 'all'}_${todayDate}`;
  }, [user?.id, kidProfileId, todayDate]);

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
          // Clear cache to ensure fresh data on next fetch
          if (cacheKey) {
            SafeLocalStorage.remove(cacheKey);
          }
          queryClient.invalidateQueries({ queryKey: ['today-habits', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, cacheKey]);

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

      // Save to cache after successful fetch
      if (cacheKey && data) {
        SafeLocalStorage.set(cacheKey, data, TODAY_HABITS_CACHE_HOURS);
      }

      return data as HabitCompletionWithDetails[];
    },
    enabled: !!user?.id,
    // Use cached data as placeholder for instant display while fetching
    placeholderData: () => {
      if (!cacheKey) return undefined;
      return SafeLocalStorage.get<HabitCompletionWithDetails[]>(cacheKey) ?? undefined;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
