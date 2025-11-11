import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { Page } from '@/types/book';
import { isValidUUID } from '@/utils/uuid';

/**
 * Hook to prefetch daily published content data on hover
 * Preloads daily published metadata and pages for instant navigation
 */
export function useDailyPublishedPrefetch() {
  const queryClient = useQueryClient();

  const prefetchDailyPublished = async (dailyPublishedId: string, bookId?: string) => {
    if (!dailyPublishedId) return;

    // Prefetch daily published metadata
    await queryClient.prefetchQuery({
      queryKey: ['daily-published', dailyPublishedId],
      queryFn: async () => {
        if (!isValidUUID(dailyPublishedId)) {
          return { data: null, isExpired: false };
        }

        const { data: activeData, error: activeError } = await supabase
          .from('daily_published')
          .select('*')
          .eq('id', dailyPublishedId)
          .eq('is_active', true)
          .eq('status', 'active')
          .maybeSingle();

        if (activeError) throw activeError;

        if (activeData) {
          return { data: activeData as DailyPublished, isExpired: false };
        }

        if (isValidUUID(dailyPublishedId)) {
          return { data: null, isExpired: true };
        }

        return { data: null, isExpired: false };
      },
      // NOTE: Prefetch queries intentionally use shorter staleTime for predictive loading freshness
      staleTime: 60 * 60 * 1000, // 1 hour
    });

    // If bookId is provided, prefetch pages data as well
    if (bookId) {
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
        // NOTE: Prefetch queries intentionally use shorter staleTime for predictive loading freshness
        staleTime: 60 * 60 * 1000,
      });
    }

    // Prefetch SEO metadata
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
      // NOTE: Prefetch queries intentionally use shorter staleTime for predictive loading freshness
      staleTime: 60 * 60 * 1000,
    });
  };

  return {
    prefetchDailyPublished,
  };
}
