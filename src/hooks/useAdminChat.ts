import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const useAdminChat = (
  sessionId?: string,
  onMessagesUpdate?: (messages: Message[], sessionId: string) => void
) => {
  const queryClient = useQueryClient();
  const { user, session } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (
    content: string,
    currentMessages: Message[] = []
  ) => {
    if (!user?.id) {
      console.error('Please sign in to use admin chat');
      return;
    }

    // Add user message optimistically
    const userMessage: Message = {
      role: 'user',
      content,
    };
    
    const updatedMessages = [...currentMessages, userMessage];
    
    // Optimistically update React Query cache
    if (sessionId) {
      queryClient.setQueryData(['admin-session-messages', sessionId], updatedMessages);
    }

    setIsLoading(true);

    try {
      if (!session?.access_token) {
        console.error('No session token available');
        throw new Error('No auth token');
      }
      
      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: updatedMessages })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Request failed:', errorData);
        throw new Error(errorData.error || 'Request failed');
      }

      if (!response.body) {
        throw new Error('No response stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      // Add empty assistant message
      let messagesWithResponse = [...updatedMessages, { role: 'assistant' as const, content: '' }];
      if (sessionId) {
        queryClient.setQueryData(['admin-session-messages', sessionId], messagesWithResponse);
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              
              // Update the last message
              messagesWithResponse = [
                ...messagesWithResponse.slice(0, -1),
                { role: 'assistant' as const, content: fullContent }
              ];
              if (sessionId) {
                queryClient.setQueryData(['admin-session-messages', sessionId], messagesWithResponse);
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }
      }

      // Final update
      if (fullContent) {
        messagesWithResponse = [
          ...messagesWithResponse.slice(0, -1),
          { role: 'assistant' as const, content: fullContent }
        ];
        
        // Update React Query cache
        if (sessionId) {
          queryClient.setQueryData(['admin-session-messages', sessionId], messagesWithResponse);
        }
        
        // Notify parent component to persist to database
        if (onMessagesUpdate && sessionId) {
          onMessagesUpdate(messagesWithResponse, sessionId);
        }
      }

    } catch (error) {
      console.error('Admin chat error:', error);
      // Revert cache on error
      if (sessionId) {
        queryClient.setQueryData(['admin-session-messages', sessionId], currentMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendMessage
  };
};
