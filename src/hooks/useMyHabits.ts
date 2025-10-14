import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * @deprecated Use useTodayHabits(kidProfileId) instead.
 * 
 * This hook was originally intended for a child-specific view but is functionally
 * identical to useTodayHabits() with a kidProfileId parameter.
 * 
 * MIGRATION: Replace `useMyHabits(kidId)` with `useTodayHabits(kidId)`
 */
export function useMyHabits(kidProfileId: string) {
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['my-habits', kidProfileId, todayDate],
    queryFn: async () => {
      if (!kidProfileId) throw new Error('Kid profile ID is required');

      const { data, error } = await supabase
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
        .eq('kid_profile_id', kidProfileId)
        .eq('completion_date', todayDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as HabitCompletionWithDetails[];
    },
    enabled: !!kidProfileId,
  });
}
