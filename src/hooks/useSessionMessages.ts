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
    staleTime: 60 * 60 * 1000, // 1 hour - instant loading for returning users
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for full day
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
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchSession };
}
