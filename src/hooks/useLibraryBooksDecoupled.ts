import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LibraryBook } from '@/types/library';
import { queryKeys } from '@/hooks/queryKeys';
import { DB_CONSTANTS } from '@/config/database';
import { LIBRARY_CONFIG } from '@/config/library';
import { logger } from '@/utils/logger';

export const useLibraryBooksDecoupled = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: queryKeys.library.books,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          created_at,
          updated_at,
          is_highlighted,
          metadata
        `)
        .eq('is_library_book', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user for activity data
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get page counts, cover images, and user activity for each book
      const booksWithData = await Promise.all(
        (data || []).map(async (book) => {
          // Get page count
          const { count } = await supabase
            .from('pages')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', book.id);
          
          // Get cover image from page_type = 'cover'
          const { data: coverPageData } = await supabase
            .from('pages')
            .select(`
              id,
              page_image_urls!inner(
                image_url,
                is_latest
              )
            `)
            .eq('book_id', book.id)
            .eq('page_type', DB_CONSTANTS.PAGE_TYPES.COVER)
            .eq('page_image_urls.is_latest', true)
            .maybeSingle();
          
          const coverImage = coverPageData?.page_image_urls?.[0]?.image_url || null;

          // Get user activity data if user is logged in
          let userActivity = null;
          if (user) {
            const { data: activityData } = await supabase
              .from('user_book_activity')
              .select('last_viewed_at, view_count')
              .eq('book_id', book.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            userActivity = activityData;
          }
          
          return {
            ...book,
            total_pages: count || 0,
            cover_image: coverImage,
            last_viewed_at: userActivity?.last_viewed_at || null,
            view_count: userActivity?.view_count || 0
          } as LibraryBook;
        })
      );

      return booksWithData;
    },
    staleTime: LIBRARY_CONFIG.CACHE_STALE_TIME_MS,
  });

  // Real-time subscriptions for library books updates
  useEffect(() => {
    logger.realtime('Setting up library books real-time subscriptions');

    // Subscribe to books table changes
    const booksChannel = supabase
      .channel(DB_CONSTANTS.CHANNELS.LIBRARY_BOOKS)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: DB_CONSTANTS.FILTERS.IS_LIBRARY_BOOK
        },
        (payload) => {
          logger.realtime('Library book changed', payload);
          queryClient.invalidateQueries({ queryKey: queryKeys.library.books });
        }
      )
      .subscribe();

    // Subscribe to daily_published changes (when books are published/unpublished)
    const dailyPublishedChannel = supabase
      .channel(DB_CONSTANTS.CHANNELS.LIBRARY_DAILY_PUBLISHED)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_published'
        },
        (payload) => {
          logger.realtime('Daily published changed', payload);
          queryClient.invalidateQueries({ queryKey: queryKeys.library.books });
        }
      )
      .subscribe();

    // Subscribe to seo_metadata changes (for cover images)
    const seoMetadataChannel = supabase
      .channel(DB_CONSTANTS.CHANNELS.LIBRARY_SEO)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seo_metadata'
        },
        (payload) => {
          logger.realtime('SEO metadata changed', payload);
          queryClient.invalidateQueries({ queryKey: queryKeys.library.books });
        }
      )
      .subscribe();

    return () => {
      logger.realtime('Cleaning up library books subscriptions');
      supabase.removeChannel(booksChannel);
      supabase.removeChannel(dailyPublishedChannel);
      supabase.removeChannel(seoMetadataChannel);
    };
  }, [queryClient]);

  return query;
};
