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
      
      // Get page counts and first page image for each book
      const booksWithData = await Promise.all(
        (data || []).map(async (book) => {
          // Get page count
          const { count } = await supabase
            .from('pages')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', book.id);
          
          // Get first page image (page_number = 0)
          const { data: firstPageData } = await supabase
            .from('pages')
            .select(`
              id,
              page_image_urls!inner(
                image_url,
                is_latest
              )
            `)
            .eq('book_id', book.id)
            .eq('page_number', 0)
            .eq('page_image_urls.is_latest', true)
            .single();
          
          // Extract first page image URL
          const firstPageImage = firstPageData?.page_image_urls?.[0]?.image_url;
          
          return {
            ...book,
            total_pages: count || 0,
            // Use first page image if thumbnail_url is missing
            cover_image: book.thumbnail_url || firstPageImage || null
          };
        })
      );

      return booksWithData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
