import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

export const useWinterThemedBooks = () => {
  return useQuery({
    queryKey: ['all-library-books'],
    queryFn: async (): Promise<DailyPublishedWithBook[]> => {
      // Get all library books
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_library_book', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!books || books.length === 0) return [];

      // Get cover images for these books
      const bookIds = books.map(b => b.id);
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

      // Transform to match DailyPublishedWithBook structure
      return books.map(book => ({
        id: book.id,
        book_id: book.id,
        title: book.book_name,
        description: book.book_description,
        published_at: book.created_at,
        expires_at: '',
        is_active: true,
        created_at: book.created_at,
        updated_at: book.updated_at,
        status: 'active' as const,
        publish_date: book.created_at,
        book: {
          book_name: book.book_name,
          book_description: book.book_description,
          user_id: book.user_id,
          created_at: book.created_at,
        },
        og_image_url: coverImageMap.get(book.id) || null,
      })) as unknown as DailyPublishedWithBook[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
