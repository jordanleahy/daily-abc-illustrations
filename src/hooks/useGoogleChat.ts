import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface SuggestedAction {
  id: string;
  label: string;
  value: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  suggestedActions?: SuggestedAction[];
}

export const useGoogleChat = (sessionId?: string, onMessagesUpdate?: (messages: Message[]) => void) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Load messages when session changes - keep old messages during transition
  useEffect(() => {
    if (sessionId) {
      setIsLoadingSession(true);
      loadSessionMessages(sessionId).finally(() => setIsLoadingSession(false));
    } else {
      setMessages([]);
      setIsLoadingSession(false);
    }
  }, [sessionId]);

  // Notify parent when messages change
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages]);

  const loadSessionMessages = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('gemini_chat_sessions')
        .select('messages')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data?.messages && Array.isArray(data.messages)) {
        setMessages(data.messages as unknown as Message[]);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  };

  const sendMessage = async (content: string | MessageContent[], displayText?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to use Google chat');
      return;
    }

    // Clear suggestions from last assistant message when user sends any message
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 && msg.role === 'assistant' 
        ? { ...msg, suggestedActions: undefined } 
        : msg
    ));

    // Add user message
    const userMessage: Message = { role: 'user', content };
    // For display purposes with images, we store the text separately
    const displayMessage: Message = { 
      role: 'user', 
      content: displayText || (typeof content === 'string' ? content : 'Uploaded an image')
    };
    setMessages(prev => [...prev, displayMessage]);
    setIsLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Session error:', sessionError);
        toast.error('Please refresh the page and try again');
        setIsLoading(false);
        throw new Error('No auth token');
      }
      
      const token = session.access_token;

      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/google-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: [...messages, userMessage] })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 || errorData.error?.includes('Rate limit')) {
          toast.error('Rate Limit Exceeded', {
            description: 'Too many requests. Please wait a moment and try again.',
            duration: 5000,
          });
        } else if (response.status === 402 || errorData.error?.includes('Payment required')) {
          toast.error('Lovable AI Credits Exhausted', {
            description: 'Please add credits to your Lovable AI workspace to continue.',
            duration: 10000,
          });
        } else {
          toast.error('Failed to send message');
        }
        throw new Error(errorData.error || 'Request failed');
      }

      if (!response.body) {
        throw new Error('No response stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let suggestedActions: SuggestedAction[] | undefined;

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
              // Update the last message with accumulated content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = fullContent;
                }
                return newMessages;
              });
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }
      }

      // Parse suggestions from final content
      const parseSuggestions = (text: string) => {
        const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
        const match = text.match(suggestRegex);
        
        if (!match) return { cleanContent: text, suggestedActions: undefined };
        
        const suggestionsText = match[1].trim();
        const cleanContent = text.replace(suggestRegex, '').trim();
        
        const actions = suggestionsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return null;
            
            const id = line.substring(0, colonIndex).trim();
            const label = line.substring(colonIndex + 1).trim();
            
            return { id, label, value: id === 'custom' ? '' : label };
          })
          .filter((action): action is SuggestedAction => action !== null);
        
        return { cleanContent, suggestedActions: actions.length > 0 ? actions : undefined };
      };

      const { cleanContent, suggestedActions: finalActions } = parseSuggestions(fullContent);

      // Update with clean content and suggestions
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.content = cleanContent;
          lastMsg.suggestedActions = finalActions;
        }
        return newMessages;
      });

    } catch (error) {
      console.error('Google chat error:', error);
      // Remove the user message and empty assistant message on error
      setMessages(prev => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithImage = async (text: string, imageDataUrl: string) => {
    const content: MessageContent[] = [
      { type: 'text', text },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ];
    await sendMessage(content, text);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    isLoadingSession,
    sendMessage,
    sendMessageWithImage,
    clearMessages
  };
};
