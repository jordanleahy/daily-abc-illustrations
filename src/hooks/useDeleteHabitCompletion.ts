import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { HabitCompletionWithDetails } from '@/types/habit';

/**
 * Hook to delete a single habit completion instance from today's checklist
 * This removes one card from the daily view without affecting the habit template
 * Includes optimistic updates for instant UI feedback
 */
export function useDeleteHabitCompletion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (completionId: string) => {
      // Use atomic database function to prevent race conditions
      const { data, error } = await supabase.rpc('delete_habit_completion_safe', {
        p_completion_id: completionId
      });

      if (error) throw error;
      
      // Type guard for the response
      const result = data as { success: boolean; error?: string; coins_deducted?: number; kid_id?: string } | null;
      
      if (!result?.success) throw new Error(result?.error || 'Failed to delete completion');

      return result;
    },
    onMutate: async (completionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['today-habits'] });
      await queryClient.cancelQueries({ queryKey: ['kid-profiles'] });

      // Snapshot previous values
      const previousHabits = queryClient.getQueryData(['today-habits']);
      const previousKidProfiles = queryClient.getQueryData(['kid-profiles']);

      // Optimistically remove the habit from today's list
      queryClient.setQueriesData(
        { queryKey: ['today-habits'] },
        (old: HabitCompletionWithDetails[] | undefined) => {
          if (!old) return old;
          return old.filter(completion => completion.id !== completionId);
        }
      );

      return { previousHabits, previousKidProfiles, completionId };
    },
    onError: (error, completionId, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueriesData({ queryKey: ['today-habits'] }, context.previousHabits);
      }
      if (context?.previousKidProfiles) {
        queryClient.setQueryData(['kid-profiles'], context.previousKidProfiles);
      }
      
      toast({
        title: 'Error',
        description: `Failed to remove task: ${error.message}`,
        variant: 'destructive',
      });
    },
    onSuccess: (result) => {
      // Real-time subscription will update the data, but invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      
      toast({
        title: 'Task removed',
        description: result.coins_deducted 
          ? `Removed from today's checklist. ${result.coins_deducted} coins deducted.`
          : 'Removed from today\'s checklist',
      });
    },
  });
}
