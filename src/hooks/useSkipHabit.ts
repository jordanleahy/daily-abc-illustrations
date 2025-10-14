import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { SkipHabitParams } from '@/types/habit';

export function useSkipHabit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      
      toast({
        title: 'Habit Skipped',
        description: `"${variables.habitTitle}" removed from today's list. ${data.coins_removed} coins subtracted.`,
      });
    },
    onError: (error, variables) => {
      toast({
        title: 'Error',
        description: `Failed to skip habit: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
