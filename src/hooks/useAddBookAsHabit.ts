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
      let habitId: string;
      
      if (activeHabit) {
        // Update existing active habit with latest book info
        await supabase
          .from('habits')
          .update({ 
            coin_amount: totalPages,
            book_id: bookId,
          })
          .eq('id', activeHabit.id);
        habitId = activeHabit.id;
      } else {
        const inactiveHabit = existingHabits?.find((h: any) => !h.is_active);
        if (inactiveHabit) {
          // Reactivate existing habit
          await supabase
            .from('habits')
            .update({ 
              is_active: true, 
              coin_amount: totalPages,
              book_id: bookId,
            })
            .eq('id', inactiveHabit.id);
          habitId = inactiveHabit.id;
        } else {
          // Create new habit
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
          habitId = createdHabit.id;
        }
      }

      // Step 2: Use unified function to create completions for all kids
      // Book habits use deposit_coins: false since coins are awarded on completion
      const today = format(new Date(), 'yyyy-MM-dd');
      const results = await Promise.all(
        kidIds.map(kidId =>
          supabase.rpc('create_habit_completion_unified', {
            p_habit_id: habitId,
            p_kid_profile_id: kidId,
            p_parent_user_id: user.id,
            p_completion_date: today,
            p_deposit_coins: false  // Book habits don't deposit until finished
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

      return { habitId, assignmentCount: kidIds.length };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['today-habits'] });
      queryClient.invalidateQueries({ queryKey: ['my-habits'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['is-book-habit'] });

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
