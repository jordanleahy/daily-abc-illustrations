import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface LibraryBookByCompletion {
  id: string;
  book_name: string;
  book_description: string | null;
  category: string | null;
  is_library_book: boolean | null;
  created_at: string;
  last_completed_at: string | null;
  completion_count: number;
}

/**
 * Fetches library books sorted by the user's most recent completion time.
 * Books the user completed most recently appear first.
 */
export function useLibraryBooksByCompletion() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['library-books-by-completion', user?.id],
    queryFn: async (): Promise<LibraryBookByCompletion[]> => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_library_books_by_completion', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching library books by completion:', error);
        throw error;
      }

      return (data || []) as LibraryBookByCompletion[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
