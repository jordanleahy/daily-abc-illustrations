import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to real-time changes in page_image_urls table for a specific book
 * Automatically invalidates query cache when images are added, updated, or deleted
 * Ensures synchronization between editor and QA panel
 */
export const usePageImageUrlsSubscription = (bookId?: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!bookId) return;

    console.log('[Real-time] Setting up page image subscription for book:', bookId);

    const channel = supabase
      .channel(`page-image-urls-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'page_image_urls',
          filter: `book_id=eq.${bookId}`
        },
        (payload) => {
          console.log('[Real-time] Page image changed:', payload);
          
          // Invalidate the specific book's images query
          queryClient.invalidateQueries({
            queryKey: ['book-page-images', bookId]
          });
          
          // Also invalidate book pages query (for metadata updates)
          queryClient.invalidateQueries({
            queryKey: ['book-pages', bookId]
          });
        }
      )
      .subscribe();

    return () => {
      console.log('[Real-time] Cleaning up page image subscription for book:', bookId);
      supabase.removeChannel(channel);
    };
  }, [bookId, queryClient]);
};
