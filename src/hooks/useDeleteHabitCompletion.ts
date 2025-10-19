import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Hook to delete a single habit completion instance from today's checklist
 * This removes one card from the daily view without affecting the habit template
 */
export function useDeleteHabitCompletion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (completionId: string) => {
      // Fetch the completion to get status and coins info
      const { data: completion, error: fetchError } = await supabase
        .from('habit_completions')
        .select('status, coins_deposited, coins_retained, kid_profile_id')
        .eq('id', completionId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the completion record
      const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', completionId);

      if (deleteError) throw deleteError;

      // Deduct coins based on status
      // - pending: deduct coins_deposited (optimistic amount)
      // - completed: deduct coins_retained (actual retained amount)
      // - declined/skipped: no adjustment (already handled)
      const coinsToDeduct = completion.status === 'pending' 
        ? completion.coins_deposited 
        : completion.status === 'completed' 
          ? completion.coins_retained 
          : 0;

      if (coinsToDeduct > 0) {
        // Fetch current coins
        const { data: kidProfile, error: fetchKidError } = await supabase
          .from('kid_profiles')
          .select('earned_coins')
          .eq('id', completion.kid_profile_id)
          .single();

        if (!fetchKidError && kidProfile) {
          const newCoins = Math.max(0, kidProfile.earned_coins - coinsToDeduct);
          
          const { error: coinError } = await supabase
            .from('kid_profiles')
            .update({ earned_coins: newCoins })
            .eq('id', completion.kid_profile_id);

          if (coinError) {
            console.error('Failed to deduct coins:', coinError);
            // Don't throw - the completion is already deleted
          }
        }
      }

      return completion;
    },
    onSuccess: () => {
      // Invalidate all habit-related queries to sync state
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      
      toast({
        title: 'Task removed',
        description: 'Removed from today\'s checklist',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
