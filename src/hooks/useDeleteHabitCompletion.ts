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
