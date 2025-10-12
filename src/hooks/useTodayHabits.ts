import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to fetch today's habit completions for all kids (for parent tracking)
 */
export function useTodayHabits() {
  const { user } = useAuth();
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['today-habits', user?.id, todayDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // TODO: Uncomment when database tables are created
      // const { data, error } = await supabase
      //   .from('habit_completions')
      //   .select(`
      //     *,
      //     habit_assignments!inner(
      //       habit_id,
      //       kid_profile_id,
      //       habits!inner(*),
      //       kid_profiles!inner(
      //         id,
      //         first_name,
      //         last_name,
      //         avatar_url,
      //         earned_coins
      //       )
      //     )
      //   `)
      //   .eq('parent_user_id', user.id)
      //   .eq('completion_date', todayDate)
      //   .order('created_at', { ascending: true });

      // if (error) throw error;
      // return data as HabitCompletionWithDetails[];
      
      // Mock data for now
      return [] as HabitCompletionWithDetails[];
    },
    enabled: !!user?.id,
  });
}
