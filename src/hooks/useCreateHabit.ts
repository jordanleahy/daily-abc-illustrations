import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { NewHabit } from '@/types/habit';
import { useToast } from './use-toast';

/**
 * Hook to create a new habit and assign it to selected kids
 */
export function useCreateHabit() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (habit: NewHabit) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .insert({
          parent_user_id: user.id,
          title: habit.title,
          description: habit.description || null,
          photo_url: habit.photo_url || null,
          coin_amount: habit.coin_amount,
          deadline_time: habit.deadline_time || null,
          is_active: true,
          display_order: 0,
          frequency: habit.frequency,
        })
        .select()
        .single();

      if (habitError) throw habitError;

      if (habit.assignedKidIds?.length > 0) {
        // Create assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from('habit_assignments')
          .insert(
            habit.assignedKidIds.map(kidId => ({
              habit_id: habitData.id,
              kid_profile_id: kidId,
              parent_user_id: user.id,
              is_active: true,
            }))
          )
          .select();

        if (assignmentError) throw assignmentError;

        // Create today's completions and deposit coins optimistically
        const today = new Date().toISOString().split('T')[0];
        const deadline = habit.deadline_time 
          ? new Date(`${today}T${habit.deadline_time}`).toISOString()
          : new Date(`${today}T23:59:59`).toISOString();

        const completions = assignments.map(assignment => ({
          habit_assignment_id: assignment.id,
          kid_profile_id: assignment.kid_profile_id,
          parent_user_id: user.id,
          completion_date: today,
          status: 'pending',
          coins_deposited: habit.coin_amount,
          coins_retained: 0,
          deadline_at: deadline,
        }));

        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert(completions);

        if (completionError) throw completionError;

        // Optimistically deposit coins to each kid
        for (const kidId of habit.assignedKidIds) {
          const { error: coinError } = await supabase.rpc('increment_kid_coins', {
            p_kid_id: kidId,
            p_amount: habit.coin_amount,
          });

          if (coinError) throw coinError;
        }
      }

      return habitData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      toast({
        title: 'Success',
        description: 'Habit created and added to today\'s checklist with coins deposited!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create habit: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
