import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLibraryBooksDecoupled = () => {
  return useQuery({
    queryKey: ['library-books-decoupled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          created_at,
          updated_at,
          thumbnail_url,
          is_highlighted
        `)
        .eq('is_library_book', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get page counts for each book
      const booksWithCounts = await Promise.all(
        (data || []).map(async (book) => {
          const { count } = await supabase
            .from('pages')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', book.id);
          
          return {
            ...book,
            total_pages: count || 0
          };
        })
      );

      return booksWithCounts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
