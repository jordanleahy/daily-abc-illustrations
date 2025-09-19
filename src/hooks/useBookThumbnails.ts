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

      // Use the new RPC function to get book thumbnail
      const { data, error } = await supabase.rpc('get_book_thumbnail', {
        p_book_id: bookId
      });

      if (error) {
        console.error('Error fetching book thumbnails:', error);
        return null;
      }

      // Return the first result since the RPC returns an array
      const thumbnail = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return thumbnail as BookThumbnail | null;
    },
    enabled: !!bookId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};