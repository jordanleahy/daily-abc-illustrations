import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time subscription for agent_questions table changes
 * Automatically invalidates queries when questions are toggled or reordered
 */
export const useAgentQuestionsSubscription = (agentType?: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = agentType 
      ? `agent-questions-${agentType}` 
      : 'agent-questions-all';
    
    const filter = agentType 
      ? { filter: `agent_type=eq.${agentType}` }
      : {};

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_questions',
          ...filter
        },
        (payload) => {
          console.log('📡 Agent questions changed:', payload);
          
          // Invalidate specific agent query if we know which one changed
          const changedAgentType = 
            (payload.new as any)?.agent_type || 
            (payload.old as any)?.agent_type;
          
          if (changedAgentType) {
            queryClient.invalidateQueries({ 
              queryKey: ['agent-questions', changedAgentType] 
            });
          }
          
          // Also invalidate the global questions registry
          queryClient.invalidateQueries({ queryKey: ['questions'] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [agentType, queryClient]);
};
