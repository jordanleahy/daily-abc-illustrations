import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { Page } from '@/types/book';
import { isValidUUID } from '@/utils/uuid';

/**
 * Hook to prefetch library book detail data on hover
 * Preloads book metadata and pages for instant navigation
 */
export function useLibraryPrefetch() {
  const queryClient = useQueryClient();

  const prefetchLibraryBook = async (dailyPublishedId: string) => {
    if (!dailyPublishedId || !isValidUUID(dailyPublishedId)) return;

    // Prefetch library book metadata
    await queryClient.prefetchQuery({
      queryKey: ['library-book', dailyPublishedId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('daily_published')
          .select(`
            *,
            book:books(
              total_pages
            )
          `)
          .eq('id', dailyPublishedId)
          .maybeSingle();

        if (error) throw error;
        return data as DailyPublished | null;
      },
      staleTime: 60 * 60 * 1000, // 1 hour
    });

    // Also prefetch SEO metadata
    await queryClient.prefetchQuery({
      queryKey: ['seo-metadata', dailyPublishedId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('seo_metadata')
          .select('*')
          .eq('daily_published_id', dailyPublishedId)
          .eq('is_latest', true)
          .eq('is_active', true)
          .eq('optimization_status', 'complete')
          .maybeSingle();

        if (error) return null;
        return data;
      },
      staleTime: 60 * 60 * 1000,
    });
  };

  const prefetchLibraryPages = async (bookId: string) => {
    if (!bookId) return;

    // Prefetch pages data
    await queryClient.prefetchQuery({
      queryKey: ['daily-published-pages', bookId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('book_id', bookId)
          .order('page_number', { ascending: true });

        if (error) throw error;
        return data as Page[] || [];
      },
      staleTime: 60 * 60 * 1000,
    });
  };

  return {
    prefetchLibraryBook,
    prefetchLibraryPages,
  };
}
