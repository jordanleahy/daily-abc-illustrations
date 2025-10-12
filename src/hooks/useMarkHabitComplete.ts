import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

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

  return useMutation({
    mutationFn: async ({ completionId, isComplete, coinsAmount, kidId }: MarkHabitCompleteParams) => {
      // TODO: Uncomment when database tables are created
      // const { error: updateError } = await supabase
      //   .from('habit_completions')
      //   .update({
      //     status: isComplete ? 'completed' : 'declined',
      //     coins_retained: isComplete ? coinsAmount : 0,
      //     marked_at: new Date().toISOString(),
      //   })
      //   .eq('id', completionId);

      // if (updateError) throw updateError;

      // if (!isComplete) {
      //   const { error: coinError } = await supabase.rpc('decrement_kid_coins', {
      //     kid_id: kidId,
      //     amount: coinsAmount,
      //   });

      //   if (coinError) throw coinError;
      // }
      
      // Mock success for now
      console.log('Habit completion would be updated:', { completionId, isComplete, coinsAmount, kidId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
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
