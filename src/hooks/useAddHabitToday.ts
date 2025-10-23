import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';
import { format } from 'date-fns';

/**
 * Hook to immediately add a habit to TODAY'S checklist.
 * Creates a new habit_completion record for today with optimistic coin deposit.
 * 
 * Different from scheduling: This bypasses the schedule table and directly creates
 * a completion record, making the habit appear on today's checklist immediately.
 * 
 * Use cases:
 * - Parent wants to add an extra habit to today
 * - One-off tasks that shouldn't be scheduled for future
 * - Immediate additions without planning ahead
 * 
 * @returns Mutation to add a habit to today's checklist
 */
export function useAddHabitToday() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');

      // Get active kid profile
      const { data: kidData, error: kidError } = await supabase
        .from('kid_profiles')
        .select('id')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (kidError) throw kidError;
      if (!kidData) throw new Error('No kid profile found');

      // Use unified function to create completion (handles assignment, coins, deadline atomically)
      const { data, error } = await supabase.rpc('create_habit_completion_unified', {
        p_habit_id: habitId,
        p_kid_profile_id: kidData.id,
        p_parent_user_id: user.id,
        p_completion_date: today,
        p_deposit_coins: true
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to add habit');
      }

      return { habitId, kidId: kidData.id };
    },
    onSuccess: () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['today-habits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habit-schedule', user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles', user?.id] });
      
      toast({
        title: 'Added to Today',
        description: 'Habit has been added to today\'s checklist',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add habit to today',
        variant: 'destructive',
      });
    },
  });
}
