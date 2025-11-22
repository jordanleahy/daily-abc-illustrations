import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LastViewedBookWithCover {
  book_id: string;
  book_name: string;
  book_description: string | null;
  is_library_book: boolean | null;
  cover_image_url: string | null;
  last_viewed_at: string;
}

/**
 * Hook to fetch the most recently viewed book with cover image for a kid profile
 * Uses the kid_last_viewed_book_with_cover database view for optimal performance (1 query instead of 5)
 * @param kidProfileId - The kid profile ID
 * @returns Query result with the last viewed book and cover image data
 */
export const useLastViewedBookWithCover = (kidProfileId: string | undefined) => {
  return useQuery({
    queryKey: ['last-viewed-book-with-cover', kidProfileId],
    queryFn: async (): Promise<LastViewedBookWithCover | null> => {
      if (!kidProfileId) return null;

      const { data, error } = await supabase
        .from('kid_last_viewed_book_with_cover')
        .select('*')
        .eq('kid_id', kidProfileId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching last viewed book with cover:', error);
        return null;
      }

      return data;
    },
    enabled: !!kidProfileId,
  });
};
