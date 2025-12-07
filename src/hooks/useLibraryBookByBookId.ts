import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/uuid';
import { queryKeys } from '@/hooks/queryKeys';
import type { LibraryBook } from '@/types/library';

/**
 * Fetch a library book directly by book_id (not daily_published_id)
 * Use this for routes like /library/:bookId/read
 */
export const useLibraryBookById = (bookId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.library.bookById(bookId || ''),
    queryFn: async () => {
      if (!bookId || !isValidUUID(bookId)) return null;

      const { data, error } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          total_pages,
          created_at,
          updated_at,
          is_highlighted,
          metadata
        `)
        .eq('id', bookId)
        .eq('is_library_book', true)
        .single();

      if (error) throw error;
      return data as LibraryBook;
    },
    enabled: !!bookId && isValidUUID(bookId),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

