import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to fetch today's habit completions for a specific kid or all kids
 * @param kidProfileId - Optional kid profile ID to filter habits
 */
export function useTodayHabits(kidProfileId?: string) {
  const { user } = useAuthContext();
  const todayDate = format(new Date(), 'yyyy-MM-dd');

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
            habits!inner(*),
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
  });
}
