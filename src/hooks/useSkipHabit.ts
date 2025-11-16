import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Toast notifications removed
import { useAuthContext } from '@/contexts/AuthContext';
import { SkipHabitParams } from '@/types/habit';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to skip a habit with optimistic updates
 */
export function useSkipHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ completionId }: SkipHabitParams) => {
      const { data, error } = await supabase.rpc('skip_habit_completion', {
        p_completion_id: completionId
      }) as { data: any; error: any };

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to skip habit');
      
      return data;
    },
    onMutate: async ({ completionId, habitTitle, coinsDeposited, kidId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['today-habits'] });
      await queryClient.cancelQueries({ queryKey: ['kid-profiles'] });

      // Snapshot previous values
      const previousHabits = queryClient.getQueryData(['today-habits', user?.id]);
      const previousKidProfiles = queryClient.getQueryData(['kid-profiles', user?.id]);

      // Optimistically update habit status to skipped
      queryClient.setQueriesData(
        { queryKey: ['today-habits'] },
        (old: HabitCompletionWithDetails[] | undefined) => {
          if (!old) return old;
          return old.map(completion => {
            if (completion.id === completionId) {
              return {
                ...completion,
                status: 'skipped',
                coins_retained: 0,
              };
            }
            return completion;
          });
        }
      );

      // Optimistically update kid profile coins
      if (kidId && coinsDeposited) {
        queryClient.setQueryData(
          ['kid-profiles', user?.id],
          (old: any[] | undefined) => {
            if (!old) return old;
            return old.map(profile => {
              if (profile.id === kidId) {
                return {
                  ...profile,
                  earned_coins: Math.max(0, profile.earned_coins - coinsDeposited),
                };
              }
              return profile;
            });
          }
        );
      }

      return { previousHabits, previousKidProfiles };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueriesData({ queryKey: ['today-habits'] }, context.previousHabits);
      }
      if (context?.previousKidProfiles) {
        queryClient.setQueryData(['kid-profiles', user?.id], context.previousKidProfiles);
      }
      
      console.error(`Failed to skip habit: ${error.message}`);
    },
    onSuccess: (data, variables) => {
      // Real-time subscription will update the data, but invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      
      console.log(`Habit Skipped - "${variables.habitTitle}" removed from today's list. ${data.coins_removed} coins subtracted.`);
    },
  });
}
