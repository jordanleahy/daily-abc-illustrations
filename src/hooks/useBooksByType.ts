import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryBook } from '@/types/library';
import type { BookTypeId } from '@/types/bookType';

interface UseBooksByTypeOptions {
  bookType: BookTypeId;
  themeSlug?: string;
}

/**
 * Generic hook to fetch published library books by book type.
 * Works for abc, opposites, rhyming, numbers, shapes, colors, etc.
 */
export function useBooksByType({ bookType, themeSlug }: UseBooksByTypeOptions) {
  return useQuery({
    queryKey: ['books-by-type', bookType, themeSlug || 'all'],
    queryFn: async (): Promise<LibraryBook[]> => {
      // Fetch from daily_published to get slugs, join with books for metadata
      const { data: publishedBooks, error } = await supabase
        .from('daily_published')
        .select(`
          id,
          slug,
          book_id,
          books!inner (
            id,
            book_name,
            book_description,
            category,
            metadata,
            is_highlighted,
            created_at,
            updated_at,
            total_pages,
            status
          )
        `)
        .eq('is_publicly_visible', true)
        .eq('books.status', 'published')
        .not('slug', 'is', null);

      if (error) {
        console.error(`Error fetching ${bookType} books:`, error);
        return [];
      }

      if (!publishedBooks || publishedBooks.length === 0) return [];

      // Filter for the specified book type
      const filteredBooks = publishedBooks.filter(pb => {
        const book = pb.books as any;
        const metadata = book?.metadata as any;
        if (metadata?.bookType !== bookType) return false;
        
        // Optional theme filtering (primarily for ABC books)
        if (themeSlug && metadata?.characterTheme !== themeSlug) {
          return false;
        }
        return true;
      });

      if (filteredBooks.length === 0) return [];

      // Get page 1 for each book, then get their images
      const bookIds = filteredBooks.map(pb => (pb.books as any).id);
      
      // Step 1: Get page 1 for each book
      const { data: firstPages } = await supabase
        .from('pages')
        .select('id, book_id')
        .in('book_id', bookIds)
        .eq('page_number', 1);

      // Build cover map
      const coverMap = new Map<string, string>();
      
      if (firstPages && firstPages.length > 0) {
        const pageIds = firstPages.map(p => p.id);
        const { data: images } = await supabase
          .from('page_image_urls')
          .select('page_id, image_url')
          .in('page_id', pageIds)
          .eq('is_latest', true)
          .not('image_url', 'is', null);

        const pageToBook = new Map(firstPages.map(p => [p.id, p.book_id]));
        images?.forEach(img => {
          const bookId = pageToBook.get(img.page_id);
          if (bookId && img.image_url) {
            coverMap.set(bookId, img.image_url);
          }
        });
      }

      // Transform to LibraryBook format with slugs
      return filteredBooks.map(pb => {
        const book = pb.books as any;
        return {
          id: book.id,
          slug: pb.slug || undefined,
          book_name: book.book_name,
          book_description: book.book_description,
          category: book.category,
          metadata: book.metadata as LibraryBook['metadata'],
          is_highlighted: book.is_highlighted,
          created_at: book.created_at,
          updated_at: book.updated_at,
          total_pages: book.total_pages,
          cover_image: coverMap.get(book.id) || null,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
