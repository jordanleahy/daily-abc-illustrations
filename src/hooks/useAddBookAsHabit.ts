import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';
import { format } from 'date-fns';

interface AddBookAsHabitParams {
  bookTitle: string;
  bookId: string;
  kidIds: string[];
  coinAmount?: number;
}

export function useAddBookAsHabit() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bookTitle, bookId, kidIds, coinAmount = 10 }: AddBookAsHabitParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Step 1: Check if book already exists as a habit
      const { data: existingHabits } = await supabase
        .from('habits')
        .select('id')
        .eq('parent_user_id', user.id)
        .eq('title', `Read: ${bookTitle}`)
        .eq('is_active', true);

      if (existingHabits && existingHabits.length > 0) {
        throw new Error('This book is already added as a habit');
      }

      // Step 2: Create the habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert({
          parent_user_id: user.id,
          title: `Read: ${bookTitle}`,
          description: `Complete reading "${bookTitle}" from the library`,
          coin_amount: coinAmount,
          frequency: 'daily',
          deadline_time: null,
          is_active: true,
          display_order: 0,
        })
        .select()
        .single();

      if (habitError) throw habitError;

      // Step 3: Create habit assignments for all selected kids
      const assignments = kidIds.map(kidId => ({
        habit_id: habit.id,
        kid_profile_id: kidId,
        parent_user_id: user.id,
        is_active: true,
      }));

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('habit_assignments')
        .insert(assignments)
        .select();

      if (assignmentError) throw assignmentError;

      // Step 4: Create today's habit completions with optimistic coin deposit
      const today = format(new Date(), 'yyyy-MM-dd');
      const completions = assignmentData.map(assignment => ({
        habit_assignment_id: assignment.id,
        kid_profile_id: assignment.kid_profile_id,
        parent_user_id: user.id,
        completion_date: today,
        status: 'pending',
        coins_deposited: coinAmount,
        coins_retained: 0,
        deadline_at: null,
      }));

      const { error: completionError } = await supabase
        .from('habit_completions')
        .insert(completions);

      if (completionError) throw completionError;

      // Step 5: Optimistically deposit coins to each kid
      for (const kidId of kidIds) {
        const { error: coinError } = await supabase
          .rpc('increment_kid_coins', {
            p_kid_id: kidId,
            p_amount: coinAmount
          });

        if (coinError) {
          console.error(`Failed to deposit coins for kid ${kidId}:`, coinError);
        }
      }

      return { habit, assignments: assignmentData, completions };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });

      toast({
        title: 'Reading Habit Added! 📚',
        description: `"${variables.bookTitle}" added to today's to-do list. ${variables.coinAmount} coins deposited!`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add book as habit',
        variant: 'destructive',
      });
    },
  });
}
