import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

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
  created_book_id: string | null;
  qa_page_images: Record<number, string> | null;
  qa_page_prompts: Record<number, string> | null;
}

const INITIAL_LIMIT = 1000;

export function useGoogleChatSessions() {
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  // Fetch sessions with pagination
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['gemini-chat-sessions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ChatSession[];
    },
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data for returning users
  });

  // Check if there might be more sessions
  const hasMore = sessions.length === limit;

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

  // Update session messages with optimistic updates
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
    onSuccess: (updatedSession) => {
      // Optimistic update: directly update the session in cache and re-sort
      queryClient.setQueryData<ChatSession[]>(['gemini-chat-sessions'], (old) => {
        if (!old) return [updatedSession];
        
        // Update the session and re-sort by last_message_at (newest first)
        const updated = old.map(session => 
          session.id === updatedSession.id ? updatedSession : session
        );
        
        return updated.sort((a, b) => {
          // Sort by last_message_at descending (newest first)
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          
          // Fallback to created_at if last_message_at is equal
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
    },
  });

  // Update session name
  const updateSessionName = useMutation({
    mutationFn: async ({ sessionId, name, silent }: { sessionId: string; name: string; silent?: boolean }) => {
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .update({ session_name: name })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return { session: data as ChatSession, silent };
    },
    onMutate: async ({ sessionId, name }) => {
      // Optimistically update the cache
      queryClient.setQueryData<ChatSession[]>(['gemini-chat-sessions'], (old) => {
        if (!old) return old;
        return old.map(session => 
          session.id === sessionId 
            ? { ...session, session_name: name }
            : session
        );
      });
    },
    onSuccess: ({ silent }) => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
      if (!silent) {
        toast.success('Conversation renamed');
      }
    },
    onError: () => {
      toast.error('Failed to rename conversation');
    },
  });

  // Delete session and optionally delete associated book
  const deleteSession = useMutation({
    mutationFn: async ({ sessionId, deleteBook }: { sessionId: string; deleteBook: boolean }) => {
      // First, get the session to find the associated book
      const { data: session, error: fetchError } = await supabase
        .from('gemini_chat_sessions')
        .select('created_book_id')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Only delete book if user chose to AND book exists
      if (deleteBook && session?.created_book_id) {
        const { error: bookError } = await supabase
          .from('books')
          .delete()
          .eq('id', session.created_book_id);

        if (bookError) throw bookError;
      }

      // Always soft delete the session
      const { error } = await supabase
        .from('gemini_chat_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
      
      return { deletedBook: deleteBook && !!session?.created_book_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      
      if (data.deletedBook) {
        toast.success('Conversation and book deleted');
      } else {
        toast.success('Conversation deleted. Book moved to your library.');
      }
    },
    onError: () => {
      toast.error('Failed to delete conversation');
    },
  });

  // Link book to session
  const linkBookToSession = useMutation({
    mutationFn: async ({ sessionId, bookId }: { sessionId: string; bookId: string }) => {
      const { error } = await supabase
        .from('gemini_chat_sessions')
        .update({ created_book_id: bookId })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
    },
    onError: () => {
      toast.error('Failed to link book to conversation');
    },
  });

  // Update QA page images
  const updateQAPageImages = useMutation({
    mutationFn: async ({ sessionId, qaPageImages }: { sessionId: string; qaPageImages: Record<number, string> }) => {
      const { error } = await supabase
        .from('gemini_chat_sessions')
        .update({ qa_page_images: qaPageImages })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
    },
    onError: () => {
      console.error('Failed to update editor page images');
    },
  });

  // Update QA page prompts
  const updateQAPagePrompts = useMutation({
    mutationFn: async ({ sessionId, qaPagePrompts }: { sessionId: string; qaPagePrompts: Record<number, string> }) => {
      const { error } = await supabase
        .from('gemini_chat_sessions')
        .update({ qa_page_prompts: qaPagePrompts })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gemini-chat-sessions'] });
    },
    onError: () => {
      console.error('Failed to update editor page prompts');
    },
  });

  // Load more sessions
  const loadMore = () => {
    setLimit(prev => prev + INITIAL_LIMIT);
  };

  return {
    sessions,
    isLoading,
    hasMore,
    loadMore,
    createSession: createSession.mutateAsync,
    updateSessionMessages: updateSessionMessages.mutateAsync,
    updateSessionName: updateSessionName.mutateAsync,
    deleteSession: deleteSession.mutateAsync,
    linkBookToSession: linkBookToSession.mutateAsync,
    updateQAPageImages: updateQAPageImages.mutateAsync,
    updateQAPagePrompts: updateQAPagePrompts.mutateAsync,
  };
}
