import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';
import { format } from 'date-fns';

/**
 * Hook to add a habit to today's checklist immediately
 */
export function useAddHabitToday() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');

      // Get kid profile (assuming single kid for now)
      const { data: kidData, error: kidError } = await supabase
        .from('kid_profiles')
        .select('id, earned_coins')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (kidError) throw kidError;
      if (!kidData) throw new Error('No kid profile found');

      // Get habit assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('habit_assignments')
        .select('id')
        .eq('habit_id', habitId)
        .eq('kid_profile_id', kidData.id)
        .eq('is_active', true)
        .single();

      if (assignmentError) throw assignmentError;
      if (!assignmentData) throw new Error('No habit assignment found');

      // Check if completion already exists for today
      const { data: existingCompletion, error: checkError } = await supabase
        .from('habit_completions')
        .select('id, status')
        .eq('habit_assignment_id', assignmentData.id)
        .eq('completion_date', today)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingCompletion) {
        throw new Error('This habit is already on today\'s checklist');
      }

      // Get habit details for coin amount and deadline
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('coin_amount, deadline_time')
        .eq('id', habitId)
        .single();

      if (habitError) throw habitError;

      // Calculate deadline
      let deadlineAt = null;
      if (habitData.deadline_time) {
        deadlineAt = `${today}T${habitData.deadline_time}`;
      }

      // Create habit completion with optimistic coin deposit
      const { error: insertError } = await supabase
        .from('habit_completions')
        .insert({
          habit_assignment_id: assignmentData.id,
          kid_profile_id: kidData.id,
          parent_user_id: user.id,
          completion_date: today,
          status: 'pending',
          coins_deposited: habitData.coin_amount,
          coins_retained: 0,
          deadline_at: deadlineAt,
        });

      if (insertError) throw insertError;

      // Optimistically deposit coins
      const { error: coinError } = await supabase
        .from('kid_profiles')
        .update({ earned_coins: kidData.earned_coins + habitData.coin_amount })
        .eq('id', kidData.id);

      if (coinError) throw coinError;

      return { habitId, kidId: kidData.id };
    },
    onSuccess: () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['today-habits', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['habit-schedule', user?.id, today] });
      
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
