import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMarkHabitComplete } from './useMarkHabitComplete';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CompleteBookHabitParams {
  bookId: string;
  kidProfileId?: string;
}

/**
 * Hook to automatically mark a reading habit as complete when book is finished
 */
export function useCompleteBookHabit() {
  const { user } = useAuthContext();
  const markComplete = useMarkHabitComplete();

  const completeBookHabit = useCallback(async ({ bookId, kidProfileId }: CompleteBookHabitParams) => {
    if (!user?.id || !kidProfileId) {
      console.log('Cannot complete book habit: missing user or kid profile');
      return;
    }

    try {
      const todayDate = format(new Date(), 'yyyy-MM-dd');

      // Step 1: Find active habit for this book
      const { data: habits, error: habitError } = await supabase
        .from('habits')
        .select('id, title, coin_amount')
        .eq('parent_user_id', user.id)
        .eq('book_id', bookId)
        .eq('is_active', true);

      if (habitError) throw habitError;
      if (!habits || habits.length === 0) {
        console.log('No active habit found for this book');
        return;
      }

      const habit = habits[0];

      // Step 2: Find the habit assignment for this kid
      const { data: assignments, error: assignmentError } = await supabase
        .from('habit_assignments')
        .select('id')
        .eq('habit_id', habit.id)
        .eq('kid_profile_id', kidProfileId)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) {
        console.log('No assignment found for this kid');
        return;
      }

      const assignment = assignments[0];

      // Step 3: Find today's completion record
      const { data: completions, error: completionError } = await supabase
        .from('habit_completions')
        .select('id, status')
        .eq('habit_assignment_id', assignment.id)
        .eq('completion_date', todayDate);

      if (completionError) throw completionError;
      if (!completions || completions.length === 0) {
        console.log('No completion record found for today');
        return;
      }

      const completion = completions[0];

      // Step 4: Only mark as complete if currently pending
      if (completion.status === 'pending') {
        await markComplete.mutateAsync({
          completionId: completion.id,
          isComplete: true,
          coinsAmount: habit.coin_amount,
          kidId: kidProfileId,
        });

        toast.success(`Reading habit completed! 📚`, {
          description: `"${habit.title}" marked as done`,
        });
      } else if (completion.status === 'completed') {
        console.log('Habit already marked as complete');
      }
    } catch (error) {
      console.error('Failed to complete book habit:', error);
      // Don't show error toast - this is a background operation
    }
  }, [user, markComplete]);

  return { completeBookHabit };
}
