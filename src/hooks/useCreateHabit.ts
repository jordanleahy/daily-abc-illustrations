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

      // 1. Create habit
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

      // 2. Create completions for each kid using unified function (fixes double deposit bug)
      if (habit.assignedKidIds?.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        const results = await Promise.all(
          habit.assignedKidIds.map(kidId =>
            supabase.rpc('create_habit_completion_unified', {
              p_habit_id: habitData.id,
              p_kid_profile_id: kidId,
              p_parent_user_id: user.id,
              p_completion_date: today,
              p_deposit_coins: true
            })
          )
        );

        const failed = results.filter(r => {
          const result = r.data as { success: boolean; error?: string } | null;
          return !result?.success;
        });
        
        if (failed.length > 0) {
          throw new Error(`Failed to create ${failed.length} completions`);
        }
      }

      return habitData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['kid-coins'] });
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
