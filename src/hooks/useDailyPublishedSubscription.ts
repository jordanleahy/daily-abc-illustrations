import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription hook for daily_published table changes
 * Automatically invalidates related queries when content changes
 */
export const useDailyPublishedSubscription = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create channel if it doesn't exist
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('daily_published_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_published'
          },
          (payload) => {
            console.log('📡 Daily published change detected:', payload);
            
            // Invalidate all related queries for immediate updates
            queryClient.invalidateQueries({ queryKey: ['daily-published'] });
            queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
            queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
            queryClient.invalidateQueries({ queryKey: ['landing-page-data'] });
            
            // If we have specific record changes, invalidate those too
            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
              queryClient.invalidateQueries({ 
                queryKey: ['daily-published', payload.new.id] 
              });
            }
            
            // Log transition events for monitoring
            if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
              const newStatus = (payload.new as any).status;
              const oldStatus = (payload.old as any).status;
              
              if (oldStatus === 'active' && newStatus === 'expired') {
                console.log('🔄 Content expired - expecting new activation');
              } else if (oldStatus === 'queued' && newStatus === 'active') {
                console.log('🎉 New content activated');
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