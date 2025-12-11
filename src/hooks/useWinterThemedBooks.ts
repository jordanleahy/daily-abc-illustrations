import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

export const useWinterThemedBooks = () => {
  return useQuery({
    queryKey: ['winter-themed-books'],
    queryFn: async (): Promise<DailyPublishedWithBook[]> => {
      // First get winter-themed books
      const { data: publishedBooks, error } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books!inner(
            id,
            book_name,
            book_description,
            category,
            total_pages,
            status,
            user_id,
            created_at
          )
        `)
        .or('title.ilike.%snow%,title.ilike.%winter%,title.ilike.%ski%,title.ilike.%mountain%,title.ilike.%snowboard%,title.ilike.%chairlift%')
        .in('status', ['active', 'expired'])
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!publishedBooks || publishedBooks.length === 0) return [];

      // Get cover images for these books
      const bookIds = publishedBooks.map(p => p.book_id);
      const { data: coverImages } = await supabase
        .from('page_image_urls')
        .select('book_id, image_url')
        .in('book_id', bookIds)
        .eq('is_latest', true)
        .order('created_at', { ascending: true });

      // Map book_id to first (cover) image
      const coverImageMap = new Map<string, string>();
      coverImages?.forEach(img => {
        if (!coverImageMap.has(img.book_id) && img.image_url) {
          coverImageMap.set(img.book_id, img.image_url);
        }
      });

      // Combine data
      return publishedBooks.map(pub => ({
        ...pub,
        og_image_url: coverImageMap.get(pub.book_id) || null,
      })) as unknown as DailyPublishedWithBook[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
