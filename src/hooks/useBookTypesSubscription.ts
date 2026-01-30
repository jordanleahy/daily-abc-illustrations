/**
 * Real-time subscription for book_types table changes
 * 
 * Automatically invalidates the book-types query cache when
 * the database table is modified, ensuring UI stays in sync.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to subscribe to book_types table changes
 * Invalidates the 'book-types' query cache on any INSERT, UPDATE, or DELETE
 */
export const useBookTypesSubscription = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    console.log('[BookTypes] Setting up real-time subscription');
    
    channelRef.current = supabase
      .channel('book-types-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'book_types',
        },
        (payload) => {
          console.log('[BookTypes] Real-time change detected:', payload.eventType);
          // Invalidate cache on any change to force refetch
          queryClient.invalidateQueries({ queryKey: ['book-types'] });
        }
      )
      .subscribe((status) => {
        console.log('[BookTypes] Subscription status:', status);
      });

    return () => {
      if (channelRef.current) {
        console.log('[BookTypes] Cleaning up subscription');
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [queryClient]);
};
