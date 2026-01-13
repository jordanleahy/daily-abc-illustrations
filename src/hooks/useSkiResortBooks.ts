import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LibraryBook } from '@/types/library';
import type { AgeRangeId } from '@/types/ageRange';
import { isValidAgeRange } from '@/types/ageRange';

// Map URL slugs to metadata.location values
const slugToLocation: Record<string, string> = {
  killington: 'KILLINGTON',
  vail: 'VAIL_RESORT',
  stratton: 'STRATTON',
  'park-city': 'PARK_CITY',
  'big-sky': 'BIG_SKY',
  aspen: 'ASPEN',
  mammoth: 'MAMMOTH',
  jackson: 'JACKSON_HOLE',
  'whistler-blackcomb': 'WHISTLER_BLACKCOMB',
  'lake-tahoe': 'LAKE_TAHOE',
  'copper-mountain': 'COPPER_MOUNTAIN',
};

// Resort display metadata
const resortMetadata: Record<string, { label: string; emoji: string; description: string }> = {
  killington: {
    label: 'Killington Mountain',
    emoji: '⛷️',
    description: 'The Beast of the East - Vermont\'s largest ski resort',
  },
  vail: {
    label: 'Vail Resort',
    emoji: '🏔️',
    description: 'Colorado\'s premier mountain destination',
  },
  stratton: {
    label: 'Stratton Mountain',
    emoji: '🎿',
    description: 'Southern Vermont\'s favorite family resort',
  },
};

export const useSkiResortBooks = (resortSlug: string | undefined) => {
  return useQuery({
    queryKey: ['ski-resort-books', resortSlug],
    queryFn: async (): Promise<LibraryBook[]> => {
      if (!resortSlug) return [];

      const location = slugToLocation[resortSlug.toLowerCase()];
      if (!location) return [];

      // Query books where metadata->>location matches
      const { data: books, error } = await supabase
        .from('books')
        .select('id, book_name, book_description, category, metadata, is_highlighted, created_at, updated_at, total_pages')
        .eq('status', 'published')
        .filter('metadata->>location', 'eq', location);

      if (error) {
        console.error('Error fetching ski resort books:', error);
        return [];
      }

      if (!books || books.length === 0) return [];

      // Get cover images and slugs for each book
      const booksWithCovers = await Promise.all(
        books.map(async (book) => {
          // Get cover page
          const { data: coverPage } = await supabase
            .from('pages')
            .select('id, letter')
            .eq('book_id', book.id)
            .eq('page_type', 'cover')
            .single();

          let coverImageUrl: string | null = null;
          let slug: string | undefined;

          if (coverPage) {
            // Get latest cover image
            const { data: coverImage } = await supabase
              .from('page_image_urls')
              .select('image_url')
              .eq('page_id', coverPage.id)
              .eq('is_latest', true)
              .single();

            coverImageUrl = coverImage?.image_url || null;
            slug = coverPage.letter?.toLowerCase();
          }

          const metadata = book.metadata as Record<string, unknown> | null;
          const rawTargetAge = metadata?.targetAge as string | undefined;
          const targetAge: AgeRangeId | undefined = rawTargetAge && isValidAgeRange(rawTargetAge) ? rawTargetAge : undefined;

          const result: LibraryBook = {
            id: book.id,
            book_name: book.book_name,
            book_description: book.book_description,
            slug,
            cover_image: coverImageUrl,
            is_highlighted: book.is_highlighted,
            created_at: book.created_at,
            updated_at: book.updated_at,
            total_pages: book.total_pages || 0,
            metadata: metadata ? {
              type: metadata.type as string | undefined,
              bookType: (metadata.bookType as string) || book.category || 'abc',
              targetAge,
            } : null,
          };

          return result;
        })
      );

      return booksWithCovers;
    },
    enabled: !!resortSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const formatResortName = (slug: string): string => {
  const metadata = resortMetadata[slug.toLowerCase()];
  if (metadata) return metadata.label;

  // Default formatting: capitalize each word
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getResortMetadata = (slug: string) => {
  return resortMetadata[slug.toLowerCase()] || {
    label: formatResortName(slug),
    emoji: '⛷️',
    description: 'Discover personalized children\'s books for your ski adventure',
  };
};

export const getResortOgMetadata = (slug: string) => {
  const metadata = getResortMetadata(slug);
  return {
    title: `${metadata.label} Children's Books | Daily ABC Illustrations`,
    description: `Personalized educational books for families visiting ${metadata.label}. Learn letters, numbers, and more with ski-themed illustrations.`,
    image: undefined, // Placeholder - can add resort-specific OG images later
  };
};
