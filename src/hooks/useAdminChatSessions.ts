import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from './useGoogleChat';
import { toast } from 'sonner';

export interface AdminChatSession {
  id: string;
  user_id: string;
  session_name: string | null;
  messages: Message[];
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  is_active: boolean;
}

const SESSIONS_PER_PAGE = 10;

export function useAdminChatSessions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-chat-sessions', page],
    queryFn: async () => {
      const from = page * SESSIONS_PER_PAGE;
      const to = from + SESSIONS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('admin_chat_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setHasMore((data?.length || 0) === SESSIONS_PER_PAGE);
      return (data || []).map(session => ({
        ...session,
        messages: (session.messages as unknown as Message[]) || [],
      })) as AdminChatSession[];
    },
    staleTime: 0,
  });

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(p => p + 1);
    }
  };

  // Create session
  const createSession = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('admin_chat_sessions')
        .insert({
          user_id: user.id,
          messages: [] as any,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        messages: (data.messages as unknown as Message[]) || [],
      } as AdminChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
    },
  });

  // Update session messages
  const updateSessionMessages = useMutation({
    mutationFn: async ({ sessionId, messages }: { sessionId: string; messages: Message[] }) => {
      const { error } = await supabase
        .from('admin_chat_sessions')
        .update({
          messages: messages as any,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
    },
  });

  // Update session name
  const updateSessionName = useMutation({
    mutationFn: async ({ sessionId, name }: { sessionId: string; name: string }) => {
      const { error } = await supabase
        .from('admin_chat_sessions')
        .update({
          session_name: name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
      toast.success('Session renamed');
    },
  });

  // Delete session (soft delete)
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('admin_chat_sessions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
      toast.success('Session deleted');
    },
  });

  return {
    sessions,
    isLoading,
    error,
    hasMore,
    loadMore,
    createSession: createSession.mutateAsync,
    updateSessionMessages: updateSessionMessages.mutateAsync,
    updateSessionName: updateSessionName.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
  };
}
