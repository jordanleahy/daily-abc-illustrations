import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryBook } from '@/types/library';
import type { Json } from '@/integrations/supabase/types';

/**
 * Fetch all published library books for public/unauthenticated viewing.
 * Does not require authentication - returns all is_library_book=true, status='published' books.
 */
export const usePublicLibraryBooks = () => {
  return useQuery({
    queryKey: ['public-library-books'],
    queryFn: async (): Promise<LibraryBook[]> => {
      // Fetch published library books with their cover images
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          category,
          created_at,
          updated_at,
          is_highlighted,
          metadata
        `)
        .eq('is_library_book', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching public library books:', booksError);
        throw booksError;
      }

      if (!books || books.length === 0) {
        return [];
      }

      // Fetch cover images for all books
      const bookIds = books.map(b => b.id);
      const { data: coverImages, error: coverError } = await supabase
        .from('page_image_urls')
        .select('book_id, image_url')
        .in('book_id', bookIds)
        .eq('is_latest', true);

      if (coverError) {
        console.error('Error fetching cover images:', coverError);
      }

      // Create a map of book_id to cover image
      const coverMap = new Map<string, string>();
      coverImages?.forEach(img => {
        if (img.image_url && !coverMap.has(img.book_id)) {
          coverMap.set(img.book_id, img.image_url);
        }
      });

      // Transform to LibraryBook format
      return books.map((book) => ({
        id: book.id,
        book_name: book.book_name,
        book_description: book.book_description,
        created_at: book.created_at,
        updated_at: book.updated_at,
        is_highlighted: book.is_highlighted,
        total_pages: 0,
        cover_image: coverMap.get(book.id) || null,
        last_viewed_at: null,
        view_count: 0,
        completion_count: 0,
        metadata: book.metadata as LibraryBook['metadata'],
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
