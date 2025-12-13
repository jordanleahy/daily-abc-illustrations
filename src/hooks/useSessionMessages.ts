import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from './useGoogleChat';
import type { ChatSession } from './useGoogleChatSessions';

/**
 * Cache-first hook for loading session messages
 * ⚡ OPTIMIZED: First checks sessions cache before fetching
 */
export function useSessionMessages(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['session-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      // ⚡ First, check if messages are already in sessions cache
      const cachedSessions = queryClient.getQueryData<ChatSession[]>(['gemini-chat-sessions', 50]);
      const cachedSession = cachedSessions?.find(s => s.id === sessionId);
      
      if (cachedSession?.messages && cachedSession.messages.length > 0) {
        return cachedSession.messages as unknown as Message[];
      }

      // Fallback: fetch from database
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .select('messages')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      return (data?.messages as unknown as Message[]) || [];
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Prefetch session messages for instant switching
 * Use on hover or predictive loading
 */
export function usePrefetchSession() {
  const queryClient = useQueryClient();

  const prefetchSession = async (sessionId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['session-messages', sessionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('gemini_chat_sessions')
          .select('messages')
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        return (data?.messages as unknown as Message[]) || [];
      },
      // NOTE: Prefetch queries intentionally use shorter staleTime for predictive loading freshness
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchSession };
}
