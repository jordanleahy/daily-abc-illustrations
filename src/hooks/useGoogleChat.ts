import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type { CharacterThemeValue } from '@/types/characterTheme';
import type { BookTypeId } from '@/types/bookType';

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
  themeId?: CharacterThemeValue;
  ageRangeId?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  suggestedActions?: SuggestedAction[];
}

export const useGoogleChat = (
  sessionId?: string,
  onMessagesUpdate?: (messages: Message[], sessionId: string) => void,
  kidAge?: { years: number; months: number },
  bookType?: string
) => {
  const queryClient = useQueryClient();
  const { user, session } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (
    content: string | MessageContent[], 
    displayText?: string, 
    currentMessages: Message[] = [],
    context?: { 
      outlineReady?: boolean; 
      bookCreated?: boolean;
      characterTheme?: CharacterThemeValue | null;
      bookType?: BookTypeId | null;
    }
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
            bookCreated: context?.bookCreated,
            kidAge,
            bookType: context?.bookType || bookType,
            characterTheme: context?.characterTheme
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
        let cleanedText = text
          .replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '')
          .replace(/```json[\s\S]*?```/g, '')           // Strip markdown JSON blocks
          .replace(/\{\s*"metadata"\s*:[\s\S]*?\}\s*\}/g, '') // Strip inline JSON metadata
          .trim();
        
        const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
        const match = cleanedText.match(suggestRegex);
        const effectiveBookType = context?.bookType || bookType;
        
        // Fallback: ABC agent questions must ALWAYS have buttons, even if the model forgets [SUGGEST]
        if (!match && effectiveBookType === 'abc') {
          // Letter case fallback
          if (cleanedText.includes('uppercase, lowercase, or mixed')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'lowercase', label: 'lowercase letters (a, b, c...)', value: 'lowercase letters' },
                { id: 'uppercase', label: 'UPPERCASE LETTERS (A, B, C...)', value: 'UPPERCASE LETTERS' },
                { id: 'mixed', label: 'Mixed Case (Aa, Bb, Cc...)', value: 'Mixed Case' },
              ]
            };
          }
          
          // Age group fallback  
          if (cleanedText.includes('What age is this ABC book for')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: '1-2', label: '1-2 years (very simple words)', value: '1-2 years' },
                { id: '2-3', label: '2-3 years (familiar objects)', value: '2-3 years' },
                { id: '3-4', label: '3-4 years (expanded vocabulary)', value: '3-4 years' },
                { id: '4-5', label: '4-5 years (more complex words)', value: '4-5 years' },
              ]
            };
          }
          
          // Subject theme fallback
          if (cleanedText.includes('What would you like each letter to feature?')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'mountain-village', label: '🏔️ Mountain Village A-Z', value: '🏔️ Mountain Village A-Z' },
                { id: 'animals', label: '🐾 Animals A-Z', value: '🐾 Animals A-Z' },
                { id: 'food', label: '🍎 Food & Fruits A-Z', value: '🍎 Food & Fruits A-Z' },
                { id: 'vehicles', label: '🚗 Things That Go A-Z', value: '🚗 Things That Go A-Z' },
                { id: 'mixed', label: '🎨 Classic Mixed Objects', value: '🎨 Classic Mixed Objects' },
                { id: 'snowboarding', label: '🏂 Snowboarding A-Z', value: '🏂 Snowboarding A-Z' },
                { id: 'custom', label: '✏️ Custom Theme', value: '' },
              ]
            };
          }
          
          // Title approval fallback
          if (cleanedText.includes('Looks perfect') || cleanedText.includes('Create the book')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'approve', label: '✅ Looks perfect! Create the book', value: 'create_book' },
                { id: 'edit-title', label: '✏️ Change the title', value: 'Change the title' },
                { id: 'edit-description', label: '📝 Update the description', value: 'Update the description' },
              ]
            };
          }
        }
        
        if (!match) {
          return { cleanContent: cleanedText, suggestedActions: undefined };
        }
        
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
      context?: { 
        outlineReady?: boolean; 
        bookCreated?: boolean;
        characterTheme?: CharacterThemeValue | null;
        bookType?: BookTypeId | null;
      }
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
