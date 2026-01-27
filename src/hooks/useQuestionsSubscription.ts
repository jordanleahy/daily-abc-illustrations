import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription for questions registry table changes
 * Automatically invalidates queries when questions are created, updated, or deleted
 */
export const useQuestionsSubscription = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = supabase
      .channel('questions-registry')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
        },
        (payload) => {
          console.log('📡 Questions registry changed:', payload);
          
          // Invalidate the global questions list
          queryClient.invalidateQueries({ queryKey: ['questions'] });
          
          // If we know which question changed, also invalidate its detail query
          const changedId = 
            (payload.new as any)?.id || 
            (payload.old as any)?.id;
          
          if (changedId) {
            queryClient.invalidateQueries({ 
              queryKey: ['question', changedId] 
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
};
