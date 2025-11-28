import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from './useGoogleChat';

interface UseAdminChatProps {
  sessionId: string | undefined;
  onMessagesUpdate?: (messages: Message[]) => void;
}

export function useAdminChat({ sessionId, onMessagesUpdate }: UseAdminChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from session when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    const loadSession = async () => {
      const { data, error } = await supabase
        .from('admin_chat_sessions')
        .select('messages')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error loading session:', error);
        return;
      }

      const loadedMessages = (data?.messages as unknown as Message[]) || [];
      setMessages(loadedMessages);
    };

    loadSession();
  }, [sessionId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !sessionId) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/admin-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (response.status === 401) {
        throw new Error('Unauthorized. Admin access required.');
      }

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (response.status === 402) {
        throw new Error('Payment required. Please check your subscription.');
      }

      if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  const streamingMessages = [...newMessages, { 
                    role: 'assistant' as const, 
                    content: fullResponse 
                  }];
                  setMessages(streamingMessages);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

      const updatedMessages = [...newMessages, { role: 'assistant' as const, content: fullResponse }];
      setMessages(updatedMessages);
      
      // Notify parent component about message updates
      if (onMessagesUpdate) {
        onMessagesUpdate(updatedMessages);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      const errorMessages = [...newMessages, { 
        role: 'assistant' as const, 
        content: `Error: ${errorMessage}` 
      }];
      setMessages(errorMessages);
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
