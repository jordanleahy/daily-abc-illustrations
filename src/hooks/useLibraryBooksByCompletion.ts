import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { LibraryBook } from '@/types/library';
import type { Json } from '@/integrations/supabase/types';

interface LibraryBookByCompletionRow {
  id: string;
  book_name: string;
  book_description: string | null;
  category: string | null;
  is_library_book: boolean | null;
  created_at: string;
  updated_at: string;
  is_highlighted: boolean;
  metadata: Json | null;
  last_completed_at: string | null;
  completion_count: number;
  cover_image_url: string | null;
}

/**
 * Fetches library books sorted by the user's most recent completion time.
 * Books the user completed most recently appear first.
 * Includes cover images and completion counts.
 */
export function useLibraryBooksByCompletion() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['library-books-by-completion', user?.id],
    queryFn: async (): Promise<LibraryBook[]> => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_library_books_by_completion', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching library books by completion:', error);
        throw error;
      }

      // Map to LibraryBook format for component compatibility
      return (data || []).map((book: LibraryBookByCompletionRow) => ({
        id: book.id,
        book_name: book.book_name,
        book_description: book.book_description,
        created_at: book.created_at,
        updated_at: book.updated_at,
        is_highlighted: book.is_highlighted,
        total_pages: 0, // Not needed for display
        cover_image: book.cover_image_url,
        last_viewed_at: book.last_completed_at,
        view_count: 0,
        completion_count: book.completion_count,
        metadata: book.metadata as Record<string, unknown> | null,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
