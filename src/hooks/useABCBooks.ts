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
      // Build query - get all ABC books by bookType in metadata
      let query = supabase
        .from('books')
        .select('id, book_name, book_description, category, metadata, is_highlighted, created_at, updated_at, total_pages')
        .eq('status', 'published')
        .filter('metadata->>bookType', 'eq', 'abc');

      // If theme provided and valid, filter by it
      if (themeSlug) {
        const theme = slugToTheme[themeSlug.toLowerCase()];
        if (theme) {
          query = query.filter('metadata->>characterTheme', 'eq', theme);
        }
      }

      const { data: books, error } = await query;

      if (error) {
        console.error('Error fetching ABC books:', error);
        return [];
      }

      if (!books || books.length === 0) return [];

      // Get page 1 for each book, then get their images
      const bookIds = books.map(b => b.id);
      
      // Step 1: Get page 1 for each book
      const { data: firstPages } = await supabase
        .from('pages')
        .select('id, book_id')
        .in('book_id', bookIds)
        .eq('page_number', 1);

      if (!firstPages || firstPages.length === 0) {
        return books.map(book => ({
          id: book.id,
          book_name: book.book_name,
          book_description: book.book_description,
          category: book.category,
          metadata: book.metadata as LibraryBook['metadata'],
          is_highlighted: book.is_highlighted,
          created_at: book.created_at,
          updated_at: book.updated_at,
          total_pages: book.total_pages,
          coverImageUrl: null,
        }));
      }

      // Step 2: Get latest images for those pages
      const pageIds = firstPages.map(p => p.id);
      const { data: images } = await supabase
        .from('page_image_urls')
        .select('page_id, image_url')
        .in('page_id', pageIds)
        .eq('is_latest', true)
        .not('image_url', 'is', null);

      // Build page_id -> book_id map
      const pageToBook = new Map(firstPages.map(p => [p.id, p.book_id]));
      
      // Build book_id -> image_url map
      const coverMap = new Map<string, string>();
      images?.forEach(img => {
        const bookId = pageToBook.get(img.page_id);
        if (bookId && img.image_url) {
          coverMap.set(bookId, img.image_url);
        }
      });

      // Transform to LibraryBook format
      return books.map(book => ({
        id: book.id,
        book_name: book.book_name,
        book_description: book.book_description,
        category: book.category,
        metadata: book.metadata as LibraryBook['metadata'],
        is_highlighted: book.is_highlighted,
        created_at: book.created_at,
        updated_at: book.updated_at,
        total_pages: book.total_pages,
        coverImageUrl: coverMap.get(book.id) || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
