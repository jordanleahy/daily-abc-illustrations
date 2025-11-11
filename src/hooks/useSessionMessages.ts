import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from './useGoogleChat';

/**
 * Cache-first hook for loading session messages
 * Uses React Query for instant switching via cache
 */
export function useSessionMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .select('messages')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      return (data?.messages as unknown as Message[]) || [];
    },
    enabled: !!sessionId,
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
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
