import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';
import { addDays, format } from 'date-fns';

/**
 * Hook to toggle habit scheduling for a specific date (default: tomorrow)
 */
export function useToggleHabitSchedule() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      habitId, 
      isCurrentlyScheduled,
      date = addDays(new Date(), 1)
    }: { 
      habitId: string; 
      isCurrentlyScheduled: boolean;
      date?: Date;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      // Get kid profile (assuming single kid)
      const { data: kidData, error: kidError } = await supabase
        .from('kid_profiles')
        .select('id')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (kidError) throw kidError;
      if (!kidData) throw new Error('No kid profile found');

      if (isCurrentlyScheduled) {
        // Remove from schedule
        const { error } = await supabase
          .from('habit_schedule')
          .delete()
          .eq('habit_id', habitId)
          .eq('kid_profile_id', kidData.id)
          .eq('scheduled_date', dateStr);

        if (error) throw error;
      } else {
        // Add to schedule
        const { error } = await supabase
          .from('habit_schedule')
          .insert({
            parent_user_id: user.id,
            habit_id: habitId,
            kid_profile_id: kidData.id,
            scheduled_date: dateStr,
          });

        if (error) throw error;
      }

      return { habitId, isScheduled: !isCurrentlyScheduled };
    },
    onSuccess: (data) => {
      const dateStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['habit-schedule', user?.id, dateStr] });
      
      toast({
        title: data.isScheduled ? 'Habit Scheduled' : 'Habit Unscheduled',
        description: data.isScheduled 
          ? 'This habit will appear tomorrow'
          : 'This habit will not appear tomorrow',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update schedule: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
