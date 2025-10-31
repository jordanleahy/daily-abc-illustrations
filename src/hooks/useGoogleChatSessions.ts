import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatSession {
  id: string;
  user_id: string;
  session_name: string | null;
  messages: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  total_tokens_used: number;
  model_used: string | null;
  agent_id: string | null;
}

export function useGoogleChatSessions() {
  const queryClient = useQueryClient();

  // Fetch all sessions for the current user
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['gemini-chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
  });

  // Create new session
  const createSession = useMutation({
    mutationFn: async (sessionName?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .insert({
          user_id: user.id,
          session_name: sessionName || null,
          messages: [],
          model_used: 'google/gemini-2.5-flash',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
    },
    onError: (error) => {
      toast.error('Failed to create conversation');
      console.error('Create session error:', error);
    },
  });

  // Update session messages
  const updateSessionMessages = useMutation({
    mutationFn: async ({ sessionId, messages }: { sessionId: string; messages: any[] }) => {
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .update({
          messages,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
    },
  });

  // Update session name
  const updateSessionName = useMutation({
    mutationFn: async ({ sessionId, name }: { sessionId: string; name: string }) => {
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .update({ session_name: name })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
      toast.success('Conversation renamed');
    },
    onError: () => {
      toast.error('Failed to rename conversation');
    },
  });

  // Delete session (soft delete)
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('gemini_chat_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
      toast.success('Conversation deleted');
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    },
  });

  return {
    sessions,
    isLoading,
    createSession: createSession.mutateAsync,
    updateSessionMessages: updateSessionMessages.mutateAsync,
    updateSessionName: updateSessionName.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
  };
}
