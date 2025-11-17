import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time subscription for landing page data updates
 * Invalidates landing page cache when books or daily published content changes
 */
export const useLandingPageSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('📡 Setting up landing page real-time subscriptions');

    // Subscribe to books table changes (library books)
    const booksChannel = supabase
      .channel('landing-books-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: 'is_library_book=eq.true'
        },
        (payload) => {
          console.log('📚 Library book changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['landing-page-data'] });
        }
      )
      .subscribe();

    // Subscribe to daily_published changes
    const dailyPublishedChannel = supabase
      .channel('landing-daily-published-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_published'
        },
        (payload) => {
          console.log('📅 Daily published changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['landing-page-data'] });
        }
      )
      .subscribe();

    // Subscribe to seo_metadata changes (for cover images)
    const seoMetadataChannel = supabase
      .channel('landing-seo-metadata-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seo_metadata'
        },
        (payload) => {
          console.log('🖼️ SEO metadata changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['landing-page-data'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up landing page subscriptions');
      supabase.removeChannel(booksChannel);
      supabase.removeChannel(dailyPublishedChannel);
      supabase.removeChannel(seoMetadataChannel);
    };
  }, [queryClient]);
};
