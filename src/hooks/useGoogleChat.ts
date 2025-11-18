import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

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
  themeId?: string;
  ageRangeId?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  suggestedActions?: SuggestedAction[];
}

export const useGoogleChat = (sessionId?: string, onMessagesUpdate?: (messages: Message[], sessionId: string) => void) => {
  const queryClient = useQueryClient();
  const { user, session } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (
    content: string | MessageContent[], 
    displayText?: string, 
    currentMessages: Message[] = [],
    context?: { outlineReady?: boolean; bookCreated?: boolean }
  ) => {
    console.log('[useGoogleChat Debug] sendMessage called:', {
      sessionId,
      currentMessageCount: currentMessages.length,
      hasContext: !!context,
      context
    });

    if (!user?.id) {
      console.error('Please sign in to use Google chat');
      return;
    }

    // Clear suggestions from last assistant message
    const messagesWithoutSuggestions = currentMessages.map((msg, idx) => 
      idx === currentMessages.length - 1 && msg.role === 'assistant' 
        ? { ...msg, suggestedActions: undefined } 
        : msg
    );

    // Add user message optimistically
    const userMessage: Message = {
      role: 'user',
      content: displayText || (typeof content === 'string' ? content : 'Uploaded an image'),
    };
    
    const updatedMessages = [...messagesWithoutSuggestions, userMessage];
    
    // Optimistically update React Query cache
    if (sessionId) {
      queryClient.setQueryData(['session-messages', sessionId], updatedMessages);
    }

    setIsLoading(true);

    try {
      // Use cached session from AuthContext (0ms instead of 50-100ms)
      if (!session?.access_token) {
        console.error('No session token available');
        throw new Error('No auth token');
      }
      
      const token = session.access_token;

      // Prepare message for API (with actual content structure)
      const apiUserMessage: Message = { role: 'user', content };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: [...messagesWithoutSuggestions, apiUserMessage],
            outlineReady: context?.outlineReady,
            bookCreated: context?.bookCreated
          })
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

      // Helper to strip suggest tags during streaming for clean display
      const stripSuggestTags = (text: string) => {
        return text.replace(/\[SUGGEST\][\s\S]*?(\[\/SUGGEST\])?$/g, '').trim();
      };

      // Add empty assistant message
      let messagesWithResponse = [...updatedMessages, { role: 'assistant' as const, content: '' }];
      if (sessionId) {
        queryClient.setQueryData(['session-messages', sessionId], messagesWithResponse);
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
              
              // Strip suggest tags during streaming for display
              const displayContent = stripSuggestTags(fullContent);
              
              // Update the last message with cleaned content
              messagesWithResponse = [
                ...messagesWithResponse.slice(0, -1),
                { role: 'assistant' as const, content: displayContent }
              ];
              if (sessionId) {
                queryClient.setQueryData(['session-messages', sessionId], messagesWithResponse);
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }
      }

      // Parse suggestions from final content and strip internal tags
      const parseSuggestions = (text: string) => {
        // First, strip out [CLARIFICATION_NEEDED: ...] tags that should never be shown
        let cleanedText = text.replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '').trim();
        
        const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
        const match = cleanedText.match(suggestRegex);
        
        if (!match) return { cleanContent: cleanedText, suggestedActions: undefined };
        
        const suggestionsText = match[1].trim();
        const cleanContent = cleanedText.replace(suggestRegex, '').trim();
        
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

      // Final update with clean content and suggestions
      if (cleanContent) {
        messagesWithResponse = [
          ...messagesWithResponse.slice(0, -1),
          { 
            role: 'assistant' as const, 
            content: cleanContent,
            suggestedActions: finalActions
          }
        ];
        
        console.log('[useGoogleChat Debug] Message streaming complete:', {
          sessionId,
          totalMessages: messagesWithResponse.length,
          lastMessagePreview: cleanContent.substring(0, 100)
        });
        
        // Update React Query cache
        if (sessionId) {
          queryClient.setQueryData(['session-messages', sessionId], messagesWithResponse);
          console.log('[useGoogleChat Debug] Updated React Query cache for session:', sessionId);
        }
        
        // Notify parent component to persist to database
        if (onMessagesUpdate && sessionId) {
          console.log('[useGoogleChat Debug] Calling onMessagesUpdate callback');
          onMessagesUpdate(messagesWithResponse, sessionId);
        }
      }

    } catch (error) {
      console.error('Google chat error:', error);
      // Revert cache on error
      if (sessionId) {
        queryClient.setQueryData(['session-messages', sessionId], currentMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    sendMessage,
    sendMessageWithImage: async (
      text: string, 
      imageDataUrl: string, 
      currentMessages: Message[] = [],
      context?: { outlineReady?: boolean; bookCreated?: boolean }
    ) => {
      return sendMessage(
        [
          { type: 'text', text },
          { type: 'image_url', image_url: { url: imageDataUrl } }
        ],
        text,
        currentMessages,
        context
      );
    }
  };
};
