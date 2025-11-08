import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { MarkHabitCompleteParams } from '@/types/habit';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to mark a habit as complete or incomplete with optimistic updates
 */
export function useMarkHabitComplete() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ completionId, isComplete, coinsAmount, kidId }: MarkHabitCompleteParams) => {
      // Determine the actual amount to deduct for book habits
      let amountToDeduct = coinsAmount;
      
      if (!isComplete) {
        // Fetch the completion with habit details to check if it's a book habit
        const { data: completion, error: fetchError } = await supabase
          .from('habit_completions')
          .select(`
            *,
            habit_assignments!inner(
              habits!inner(book_id, coin_amount)
            )
          `)
          .eq('id', completionId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // If this is a book habit (has book_id), use the habit's coin_amount
        if (completion.habit_assignments.habits.book_id) {
          amountToDeduct = completion.habit_assignments.habits.coin_amount;
        }
      }
      
      // Update completion status and coins_retained
      const { error: updateError } = await supabase
        .from('habit_completions')
        .update({
          status: isComplete ? 'completed' : 'declined',
          coins_retained: isComplete ? coinsAmount : 0,
          marked_at: new Date().toISOString(),
        })
        .eq('id', completionId);

      if (updateError) throw updateError;

      // If declined, remove coins (use amountToDeduct for book habits)
      if (!isComplete) {
        const { error: coinError } = await supabase.rpc('decrement_kid_coins', {
          p_kid_id: kidId,
          p_amount: amountToDeduct,
        });

        if (coinError) throw coinError;
      }
      
      return { completionId, isComplete, coinsAmount, kidId, amountToDeduct };
    },
    onMutate: async ({ completionId, isComplete, coinsAmount, kidId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['today-habits'] });
      await queryClient.cancelQueries({ queryKey: ['kid-profiles'] });

      // Snapshot previous values
      const previousHabits = queryClient.getQueryData(['today-habits', user?.id]);
      const previousKidProfiles = queryClient.getQueryData(['kid-profiles', user?.id]);

      // Optimistically update habit completion status
      queryClient.setQueriesData(
        { queryKey: ['today-habits'] },
        (old: HabitCompletionWithDetails[] | undefined) => {
          if (!old) return old;
          return old.map(completion => {
            if (completion.id === completionId) {
              return {
                ...completion,
                status: isComplete ? 'completed' : 'declined',
                coins_retained: isComplete ? coinsAmount : 0,
                marked_at: new Date().toISOString(),
              };
            }
            return completion;
          });
        }
      );

      // Optimistically update kid profile coins (only for declined habits)
      if (!isComplete) {
        queryClient.setQueryData(
          ['kid-profiles', user?.id],
          (old: any[] | undefined) => {
            if (!old) return old;
            return old.map(profile => {
              if (profile.id === kidId) {
                return {
                  ...profile,
                  earned_coins: Math.max(0, profile.earned_coins - coinsAmount),
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
      
      toast({
        title: 'Error',
        description: `Failed to update habit: ${error.message}`,
        variant: 'destructive',
      });
    },
    onSuccess: (_, variables) => {
      // Real-time subscription will update the data, but invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      
      toast({
        title: 'Success',
        description: variables.isComplete ? 'Habit marked as complete' : 'Habit marked as not done',
      });
    },
  });
}
