import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription hook for page_image_urls table changes
 * Automatically invalidates related queries when page images change
 */
export const usePageImageSubscription = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel if it doesn't exist
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('page_image_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'page_image_urls'
          },
          (payload) => {
            console.log('📸 Page image change detected:', payload);
            
            // Invalidate books queries to refresh images
            queryClient.invalidateQueries({ queryKey: ['books'] });
            
            // If we have specific record changes, invalidate those too
            if (payload.new && typeof payload.new === 'object' && 'book_id' in payload.new) {
              queryClient.invalidateQueries({ 
                queryKey: ['book-images', payload.new.book_id] 
              });
            }
            
            // Log image generation events for monitoring
            if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
              const newStatus = (payload.new as any).generation_status;
              const oldStatus = (payload.old as any).generation_status;
              
              if (oldStatus !== 'complete' && newStatus === 'complete') {
                console.log('🎨 New image generated and ready');
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return null; // This hook doesn't return data, just manages subscriptions
};