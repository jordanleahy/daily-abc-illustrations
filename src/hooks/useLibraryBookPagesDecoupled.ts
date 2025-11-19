import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/uuid';
import type { Page } from '@/types/book';
import { queryKeys } from '@/hooks/queryKeys';

export const useLibraryBookPagesDecoupled = (bookId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.pages.byBook(bookId || ''),
    queryFn: async () => {
      if (!bookId || !isValidUUID(bookId)) return [];

      const { data, error } = await supabase
        .from('pages')
        .select(`
          id,
          book_id,
          letter,
          page_number,
          page_type,
          title,
          description,
          content,
          created_at,
          updated_at
        `)
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      return (data || []) as Page[];
    },
    enabled: !!bookId && isValidUUID(bookId),
  });
};
