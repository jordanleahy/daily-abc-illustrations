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

      // Get cover images for each book
      const bookIds = books.map(b => b.id);
      const { data: pages } = await supabase
        .from('pages')
        .select(`
          book_id,
          page_image_urls!inner(image_url, is_latest)
        `)
        .in('book_id', bookIds)
        .eq('page_number', 1);

      // Create a map of book_id to cover image
      const coverMap = new Map<string, string>();
      pages?.forEach(page => {
        const imageUrls = page.page_image_urls as unknown as Array<{ image_url: string; is_latest: boolean }>;
        const latestImage = imageUrls?.find(img => img.is_latest);
        if (latestImage?.image_url && page.book_id) {
          coverMap.set(page.book_id, latestImage.image_url);
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
