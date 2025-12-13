import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to create a switch stance goal from a regular stance goal
 */
export function useCreateSwitchGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regularGoalId: string) => {
      const { data, error } = await supabase.rpc('create_switch_goal_from_regular', {
        p_regular_goal_id: regularGoalId,
      });

      if (error) throw error;
      return data as string; // Returns the new switch goal ID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
      toast.success('Switch stance goal created!');
    },
    onError: (error: any) => {
      console.error('Failed to create switch goal:', error);
      toast.error(error.message || 'Failed to create switch goal');
    },
  });
}
