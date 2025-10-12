import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to fetch today's habits for a specific child (for child view)
 */
export function useMyHabits(kidProfileId: string) {
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['my-habits', kidProfileId, todayDate],
    queryFn: async () => {
      if (!kidProfileId) throw new Error('Kid profile ID is required');

      // TODO: Uncomment when database tables are created
      // const { data, error } = await supabase
      //   .from('habit_completions')
      //   .select(`
      //     *,
      //     habit_assignments!inner(
      //       habit_id,
      //       kid_profile_id,
      //       habits!inner(*)
      //     )
      //   `)
      //   .eq('kid_profile_id', kidProfileId)
      //   .eq('completion_date', todayDate)
      //   .order('created_at', { ascending: true });

      // if (error) throw error;
      // return data as HabitCompletionWithDetails[];
      
      // Mock data for now
      return [] as HabitCompletionWithDetails[];
    },
    enabled: !!kidProfileId,
  });
}
