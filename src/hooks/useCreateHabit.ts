import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NewHabit } from '@/types/habit';
import { useToast } from './use-toast';

/**
 * Hook to create a new habit and assign it to selected kids
 */
export function useCreateHabit() {
  const { user } = useAuth();
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
        })
        .select()
        .single();

      if (habitError) throw habitError;

      if (habit.assignedKidIds?.length > 0) {
        const { error: assignmentError } = await supabase
          .from('habit_assignments')
          .insert(
            habit.assignedKidIds.map(kidId => ({
              habit_id: habitData.id,
              kid_profile_id: kidId,
              parent_user_id: user.id,
              is_active: true,
            }))
          );

        if (assignmentError) throw assignmentError;
      }

      return habitData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: 'Success',
        description: 'Habit created successfully',
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
