import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface MarkHabitCompleteParams {
  completionId: string;
  isComplete: boolean;
  coinsAmount: number;
  kidId: string;
}

/**
 * Hook to mark a habit as complete or incomplete
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
      
      // If completed, coins stay (they were already deposited at 3 AM for regular habits,
      // or will be deposited in reading view for book habits)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      
      toast({
        title: 'Success',
        description: variables.isComplete ? 'Habit marked as complete' : 'Habit marked as not done',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update habit: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
