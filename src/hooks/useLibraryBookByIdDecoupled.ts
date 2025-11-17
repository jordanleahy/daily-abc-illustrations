import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/uuid';
import { queryKeys } from '@/hooks/queryKeys';

export const useLibraryBookByIdDecoupled = (bookId: string | undefined) => {
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
          updated_at
        `)
        .eq('id', bookId)
        .eq('is_library_book', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookId && isValidUUID(bookId),
  });
};
