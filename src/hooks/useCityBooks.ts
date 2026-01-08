import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryBook } from '@/types/library';

export const useCityBooks = (citySlug: string | undefined) => {
  return useQuery({
    queryKey: ['city-books', citySlug],
    queryFn: async (): Promise<LibraryBook[]> => {
      if (!citySlug) return [];

      // Fetch books for this city that are published
      const { data: books, error } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          category,
          status,
          city,
          created_at,
          updated_at,
          is_highlighted,
          total_pages,
          metadata
        `)
        .eq('city', citySlug.toLowerCase())
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching city books:', error);
        throw error;
      }

      if (!books || books.length === 0) {
        return [];
      }

      // Get cover images for each book (first page's image)
      const booksWithCovers = await Promise.all(
        books.map(async (book) => {
          const { data: pageImage } = await supabase
            .from('page_image_urls')
            .select('image_url')
            .eq('book_id', book.id)
            .eq('is_latest', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          return {
            id: book.id,
            book_name: book.book_name,
            book_description: book.book_description,
            created_at: book.created_at,
            updated_at: book.updated_at,
            is_highlighted: book.is_highlighted,
            total_pages: book.total_pages || 0,
            cover_image: pageImage?.image_url || null,
            metadata: book.metadata as LibraryBook['metadata'],
          } satisfies LibraryBook;
        })
      );

      return booksWithCovers;
    },
    enabled: !!citySlug,
  });
};

// Helper to format city name for display
export const formatCityName = (slug: string): string => {
  // Handle common patterns like "jerseycity" -> "Jersey City"
  const cityMappings: Record<string, string> = {
    jerseycity: 'Jersey City',
    newyork: 'New York',
    losangeles: 'Los Angeles',
    sanfrancisco: 'San Francisco',
    neworleans: 'New Orleans',
    saltlakecity: 'Salt Lake City',
    kansascity: 'Kansas City',
    oklahomacity: 'Oklahoma City',
    atlanticcity: 'Atlantic City',
  };

  if (cityMappings[slug.toLowerCase()]) {
    return cityMappings[slug.toLowerCase()];
  }

  // Default: capitalize first letter
  return slug.charAt(0).toUpperCase() + slug.slice(1);
};
