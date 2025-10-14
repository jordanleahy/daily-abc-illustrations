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

      // Fetch the book to get total_pages
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('total_pages')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;
      const totalPages = book?.total_pages || 26;

      const habitTitle = `Read: ${bookTitle}`;

      // Step 1: Look for an existing habit (active or inactive)
      const { data: existingHabits, error: existingFetchError } = await supabase
        .from('habits')
        .select('id, is_active')
        .eq('parent_user_id', user.id)
        .eq('title', habitTitle);

      if (existingFetchError) throw existingFetchError;

      const activeHabit = existingHabits?.find((h: any) => h.is_active);
      let habit: any;
      if (activeHabit) {
        // Idempotent path: treat as add by ensuring assignments/completions and syncing coin amount and book_id
        const { data: updatedHabit, error: updateErr } = await supabase
          .from('habits')
          .update({ 
            coin_amount: totalPages,
            book_id: bookId,
          })
          .eq('id', activeHabit.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        habit = updatedHabit;
      }

      const inactiveHabit = existingHabits?.find((h: any) => !h.is_active);
      if (inactiveHabit) {
        // Step 2a: Reactivate the existing habit and update book_id
        const { data: reactivatedHabit, error: reactivateError } = await supabase
          .from('habits')
          .update({ 
            is_active: true, 
            coin_amount: totalPages,
            book_id: bookId,
          })
          .eq('id', inactiveHabit.id)
          .select()
          .single();

        if (reactivateError) throw reactivateError;
        habit = reactivatedHabit;
      } else {
        // Step 2b: Create a new habit
      const { data: createdHabit, error: habitError } = await supabase
        .from('habits')
        .insert({
          parent_user_id: user.id,
          title: habitTitle,
          description: `Complete reading "${bookTitle}" from the library`,
          book_id: bookId,
          coin_amount: totalPages,
          frequency: 'daily',
          deadline_time: null,
          is_active: true,
          display_order: 0,
        })
        .select()
        .single();

        if (habitError) throw habitError;
        habit = createdHabit;
      }

      // Step 3: Ensure habit assignments exist and are active for all selected kids
      const { data: existingAssignments, error: existingAssignmentsError } = await supabase
        .from('habit_assignments')
        .select('id, kid_profile_id, is_active')
        .eq('habit_id', habit.id);

      if (existingAssignmentsError) throw existingAssignmentsError;

      const toReactivateIds = (existingAssignments || [])
        .filter((a: any) => !a.is_active && kidIds.includes(a.kid_profile_id))
        .map((a: any) => a.id);

      let reactivatedAssignments: any[] = [];
      if (toReactivateIds.length > 0) {
        const { data: reactAssignments, error: reactErr } = await supabase
          .from('habit_assignments')
          .update({ is_active: true })
          .in('id', toReactivateIds)
          .select();

        if (reactErr) throw reactErr;
        reactivatedAssignments = reactAssignments || [];
      }

      const toInsert = kidIds.filter(
        (kidId) => !(existingAssignments || []).some((a: any) => a.kid_profile_id === kidId)
      );

      let insertedAssignments: any[] = [];
      if (toInsert.length > 0) {
        const assignments = toInsert.map((kidId) => ({
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
        insertedAssignments = assignmentData || [];
      }

      const activeExistingAssignments = (existingAssignments || []).filter(
        (a: any) => a.is_active && kidIds.includes(a.kid_profile_id)
      );

      const allAssignments = [
        ...activeExistingAssignments,
        ...reactivatedAssignments,
        ...insertedAssignments,
      ];

      // Step 4: Create today's habit completions only for assignments that don't have one yet
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: existingCompletions } = await supabase
        .from('habit_completions')
        .select('habit_assignment_id')
        .in('habit_assignment_id', allAssignments.map((a: any) => a.id))
        .eq('completion_date', today);

      const existingCompletionIds = new Set(
        (existingCompletions || []).map((c: any) => c.habit_assignment_id)
      );

      const completionsToInsert = allAssignments
        .filter((a: any) => !existingCompletionIds.has(a.id))
        .map((assignment: any) => ({
          habit_assignment_id: assignment.id,
          kid_profile_id: assignment.kid_profile_id,
          parent_user_id: user.id,
          completion_date: today,
          status: 'pending',
          coins_deposited: 0,
          coins_retained: 0,
          deadline_at: null,
        }));

      if (completionsToInsert.length > 0) {
        const { error: completionError } = await supabase
          .from('habit_completions')
          .insert(completionsToInsert);

        if (completionError) throw completionError;
      }

      // No coin deposit for book habits - coins awarded upon completion in reading view
      return { habit, assignments: allAssignments, completions: completionsToInsert };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });

      toast({
        title: 'Reading Habit Added! 📚',
        description: `"${variables.bookTitle}" added to today's reading list!`,
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
