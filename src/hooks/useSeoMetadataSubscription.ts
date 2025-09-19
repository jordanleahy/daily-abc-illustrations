import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to real-time updates for SEO metadata
 * Updates relevant query cache when SEO metadata changes
 */
export const useSeoMetadataSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('seo-metadata-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'seo_metadata'
        },
        (payload) => {
          console.log('SEO metadata changed:', payload);
          
          // Invalidate and refetch SEO metadata queries
          if (payload.new && (payload.new as any).daily_published_id) {
            queryClient.invalidateQueries({
              queryKey: ['seo-metadata', (payload.new as any).daily_published_id]
            });
          }
          
          if (payload.old && (payload.old as any).daily_published_id) {
            queryClient.invalidateQueries({
              queryKey: ['seo-metadata', (payload.old as any).daily_published_id]
            });
          }
          
          // Also invalidate the daily published queue to refresh thumbnails
          queryClient.invalidateQueries({
            queryKey: ['daily-published-queue']
          });
          
          // Invalidate book SEO metadata queries
          queryClient.invalidateQueries({
            queryKey: ['book-seo-metadata']
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};