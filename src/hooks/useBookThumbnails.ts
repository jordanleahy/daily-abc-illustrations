import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BookThumbnail {
  id: string;
  book_id: string;
  user_id: string;
  thumbnail_url: string | null;
  generation_status: string;
  is_latest: boolean;
  version_number: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch book thumbnails directly from book_thumbnails table
 * This works independently of SEO metadata and daily publication status
 */
export const useBookThumbnails = (bookId?: string) => {
  return useQuery({
    queryKey: ['book-thumbnails', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      try {
        // Use direct SQL query since book_thumbnails table isn't in generated types yet
        const { data, error } = await supabase
          .rpc('get_book_thumbnail', { p_book_id: bookId } as any);

        if (error) {
          console.error('Error fetching book thumbnails:', error);
          return null;
        }

        // Handle the response - RPC functions return arrays
        if (Array.isArray(data) && data.length > 0) {
          const thumbnail = data[0];
          return {
            id: thumbnail.id,
            book_id: thumbnail.book_id,
            user_id: thumbnail.user_id,
            thumbnail_url: thumbnail.thumbnail_url,
            generation_status: thumbnail.generation_status,
            is_latest: thumbnail.is_latest,
            version_number: thumbnail.version_number,
            created_at: thumbnail.created_at,
            updated_at: thumbnail.updated_at,
          } as BookThumbnail;
        }

        return null;
      } catch (error) {
        console.error('Error fetching book thumbnails:', error);
        return null;
      }
    },
    enabled: !!bookId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};