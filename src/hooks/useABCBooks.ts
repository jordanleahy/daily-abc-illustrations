import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryBook } from '@/types/library';

// Map URL slugs to metadata.abcTheme or characterTheme values
const slugToTheme: Record<string, string> = {
  animals: 'animals',
  food: 'food',
  nature: 'nature',
  sports: 'sports',
  vehicles: 'vehicles',
  ocean: 'ocean',
  space: 'space',
  dinosaurs: 'dinosaurs',
  farm: 'farm',
  bugs: 'bugs',
};

// Display names for themes
const themeDisplayNames: Record<string, string> = {
  animals: 'Animals',
  food: 'Food',
  nature: 'Nature',
  sports: 'Sports',
  vehicles: 'Vehicles',
  ocean: 'Ocean',
  space: 'Space',
  dinosaurs: 'Dinosaurs',
  farm: 'Farm',
  bugs: 'Bugs',
};

export function getABCThemeDisplayName(slug: string): string {
  return themeDisplayNames[slug.toLowerCase()] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function isValidABCTheme(slug: string): boolean {
  return slug.toLowerCase() in slugToTheme;
}

interface UseABCBooksOptions {
  themeSlug?: string | undefined;
}

export function useABCBooks({ themeSlug }: UseABCBooksOptions = {}) {
  return useQuery({
    queryKey: ['abc-books', themeSlug || 'all'],
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
        console.error('Error fetching ABC books:', error);
        return [];
      }

      if (!publishedBooks || publishedBooks.length === 0) return [];

      // Filter for ABC books and optionally by theme
      const abcBooks = publishedBooks.filter(pb => {
        const book = pb.books as any;
        const metadata = book?.metadata as any;
        if (metadata?.bookType !== 'abc') return false;
        
        if (themeSlug) {
          const theme = slugToTheme[themeSlug.toLowerCase()];
          if (theme && metadata?.characterTheme !== theme) return false;
        }
        return true;
      });

      if (abcBooks.length === 0) return [];

      // Get page 1 for each book, then get their images
      const bookIds = abcBooks.map(pb => (pb.books as any).id);
      
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
      return abcBooks.map(pb => {
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
