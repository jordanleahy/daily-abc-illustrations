import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LibraryBookWithImages {
  id: string;
  book_id: string;
  title: string;
  description: string | null;
  published_at: string;
  created_at: string;
  book: {
    book_name: string;
    book_description: string | null;
    user_id: string;
    created_at: string;
  };
  cover_image_url: string | null;
  educational_image_url: string | null;
}

export const useWinterThemedBooks = () => {
  return useQuery({
    queryKey: ['all-library-books-with-images'],
    queryFn: async (): Promise<LibraryBookWithImages[]> => {
      // Get all library books
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_library_book', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!books || books.length === 0) return [];

      const bookIds = books.map(b => b.id);

      // Get cover and educational pages for these books
      const { data: pages } = await supabase
        .from('pages')
        .select('id, book_id, page_type')
        .in('book_id', bookIds)
        .in('page_type', ['cover', 'educational']);

      if (!pages || pages.length === 0) {
        return books.map(book => ({
          id: book.id,
          book_id: book.id,
          title: book.book_name,
          description: book.book_description,
          published_at: book.created_at,
          created_at: book.created_at,
          book: {
            book_name: book.book_name,
            book_description: book.book_description,
            user_id: book.user_id,
            created_at: book.created_at,
          },
          cover_image_url: null,
          educational_image_url: null,
        }));
      }

      // Get images for these pages
      const pageIds = pages.map(p => p.id);
      const { data: images } = await supabase
        .from('page_image_urls')
        .select('page_id, book_id, image_url')
        .in('page_id', pageIds)
        .eq('is_latest', true)
        .not('image_url', 'is', null);

      // Create maps for cover and educational images
      const coverImageMap = new Map<string, string>();
      const educationalImageMap = new Map<string, string>();

      // Map page_id to page_type for lookup
      const pageTypeMap = new Map<string, { book_id: string; page_type: string }>();
      pages.forEach(p => pageTypeMap.set(p.id, { book_id: p.book_id, page_type: p.page_type }));

      images?.forEach(img => {
        const pageInfo = pageTypeMap.get(img.page_id);
        if (pageInfo && img.image_url) {
          if (pageInfo.page_type === 'cover') {
            coverImageMap.set(pageInfo.book_id, img.image_url);
          } else if (pageInfo.page_type === 'educational') {
            educationalImageMap.set(pageInfo.book_id, img.image_url);
          }
        }
      });

      return books.map(book => ({
        id: book.id,
        book_id: book.id,
        title: book.book_name,
        description: book.book_description,
        published_at: book.created_at,
        created_at: book.created_at,
        book: {
          book_name: book.book_name,
          book_description: book.book_description,
          user_id: book.user_id,
          created_at: book.created_at,
        },
        cover_image_url: coverImageMap.get(book.id) || null,
        educational_image_url: educationalImageMap.get(book.id) || null,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });
};
