import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

/**
 * Hook to toggle auto-schedule (frequency between 'daily' and 'manual')
 * When enabled: habit appears automatically every day for all assigned kids
 * When disabled: habit requires manual scheduling
 */
export function useToggleAutoSchedule() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ habitId, isAutoSchedule }: { habitId: string; isAutoSchedule: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update the frequency field
      const { error } = await supabase
        .from('habits')
        .update({ 
          frequency: isAutoSchedule ? 'daily' : 'manual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('parent_user_id', user.id);

      if (error) throw error;

      // If turning OFF auto-schedule, optionally clean up future manual schedules
      // (currently we just leave them - parents can manage manually)

      return { habitId, isAutoSchedule };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-schedule'] });
      
      toast({
        title: data.isAutoSchedule ? 'Auto-schedule enabled' : 'Auto-schedule disabled',
        description: data.isAutoSchedule 
          ? 'This habit will now appear automatically every day'
          : 'You can now schedule this habit manually',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to toggle auto-schedule: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
