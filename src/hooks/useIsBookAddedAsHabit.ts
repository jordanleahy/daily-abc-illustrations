import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';

/**
 * Hook to check if a book is already added as a habit for today
 */
export function useIsBookAddedAsHabit(bookId: string | undefined) {
  const { user } = useAuthContext();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['is-book-habit', bookId, user?.id, today],
    queryFn: async () => {
      if (!user?.id || !bookId) return false;

      // Check if there's an active habit with this book_id
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('parent_user_id', user.id)
        .eq('book_id', bookId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (habitsError) throw habitsError;

      // If an active habit exists with this book_id, the book is added as a habit
      return !!habits;
    },
    enabled: !!user?.id && !!bookId,
    refetchOnMount: 'always', // Always refetch to ensure fresh data after habit changes
    staleTime: 0, // Consider data stale immediately
  });
}
