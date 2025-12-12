import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Fetches completion counts for books (per-family: all completed readings by current user)
 */
export function useBookCompletionCounts(bookIds: string[]) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['book-completion-counts', user?.id, bookIds],
    queryFn: async () => {
      if (!user || bookIds.length === 0) return new Map<string, number>();

      const { data, error } = await supabase
        .from('user_book_activity')
        .select('book_id, reading_completed')
        .eq('user_id', user.id)
        .in('book_id', bookIds)
        .eq('reading_completed', true);

      if (error) {
        console.error('Error fetching completion counts:', error);
        return new Map<string, number>();
      }

      // Count completions per book
      const completionMap = new Map<string, number>();
      (data || []).forEach(activity => {
        if (activity.book_id) {
          completionMap.set(activity.book_id, (completionMap.get(activity.book_id) || 0) + 1);
        }
      });

      return completionMap;
    },
    enabled: !!user && bookIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
