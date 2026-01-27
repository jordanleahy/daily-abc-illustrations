import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { AgentQuestionWithDetails } from './useQuestions';

/**
 * Real-time subscription for agent_questions table changes
 * Provides optimistic cache updates for instant UI sync across tabs/users
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
          
          const changedAgentType = 
            (payload.new as any)?.agent_type || 
            (payload.old as any)?.agent_type;
          
          if (changedAgentType) {
            // Optimistic cache update for instant UI sync
            if (payload.eventType === 'UPDATE' && payload.new) {
              queryClient.setQueryData(
                ['agent-questions', changedAgentType],
                (old: AgentQuestionWithDetails[] | undefined) => {
                  if (!old) return old;
                  
                  // Merge the updated record immediately
                  return old.map(item => 
                    item.id === (payload.new as any).id
                      ? { 
                          ...item, 
                          is_enabled: (payload.new as any).is_enabled,
                          sort_order: (payload.new as any).sort_order 
                        }
                      : item
                  ).sort((a, b) => {
                    // Re-sort: enabled first, then by sort_order
                    if (a.is_enabled !== b.is_enabled) return a.is_enabled ? -1 : 1;
                    return a.sort_order - b.sort_order;
                  });
                }
              );
            }
            
            // Also refetch to ensure full consistency
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
