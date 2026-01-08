import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryBook } from '@/types/library';

// Map URL slugs to metadata.city values
const slugToMetadataCity: Record<string, string> = {
  jerseycity: 'JERSEY_CITY',
  hoboken: 'HOBOKEN',
  newyork: 'NEW_YORK_CITY',
  newyorkcity: 'NEW_YORK_CITY',
};

export const useCityBooks = (citySlug: string | undefined) => {
  return useQuery({
    queryKey: ['city-books', citySlug],
    queryFn: async (): Promise<LibraryBook[]> => {
      if (!citySlug) return [];

      // Convert URL slug to metadata city format
      const metadataCity = slugToMetadataCity[citySlug.toLowerCase()] || citySlug.toUpperCase();

      // Fetch books for this city that are published
      const { data: books, error } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          category,
          status,
          created_at,
          updated_at,
          is_highlighted,
          total_pages,
          metadata
        `)
        .eq('metadata->>city', metadataCity)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching city books:', error);
        throw error;
      }

      if (!books || books.length === 0) {
        return [];
      }

      // Get cover images for each book (from cover page type)
      const booksWithCovers = await Promise.all(
        books.map(async (book) => {
          // First, find the cover page for this book
          const { data: coverPage } = await supabase
            .from('pages')
            .select('id')
            .eq('book_id', book.id)
            .eq('page_type', 'cover')
            .limit(1)
            .maybeSingle();

          let pageImage = null;
          if (coverPage) {
            // Get the latest image for the cover page
            const { data: coverImageData } = await supabase
              .from('page_image_urls')
              .select('image_url')
              .eq('page_id', coverPage.id)
              .eq('is_latest', true)
              .limit(1)
              .maybeSingle();
            pageImage = coverImageData;
          } else {
            // Fallback: get first page image if no cover page exists
            const { data: fallbackImage } = await supabase
              .from('page_image_urls')
              .select('image_url')
              .eq('book_id', book.id)
              .eq('is_latest', true)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();
            pageImage = fallbackImage;
          }

          // Ensure bookType is set from category for proper carousel categorization
          const existingMetadata = (book.metadata || {}) as LibraryBook['metadata'];
          const bookType = existingMetadata?.bookType || book.category || 'other';
          
          return {
            id: book.id,
            book_name: book.book_name,
            book_description: book.book_description,
            created_at: book.created_at,
            updated_at: book.updated_at,
            is_highlighted: book.is_highlighted,
            total_pages: book.total_pages || 0,
            cover_image: pageImage?.image_url || null,
            metadata: {
              ...existingMetadata,
              bookType,
            },
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
