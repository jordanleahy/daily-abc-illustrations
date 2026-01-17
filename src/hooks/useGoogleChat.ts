import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type { CharacterThemeValue } from '@/types/characterTheme';
import type { BookTypeId } from '@/types/bookType';
import type { GradeId } from '@/types/grade';
import { SEASON_OPTIONS, type SeasonId } from '@/types/season';
import { ENVIRONMENT_OPTIONS, type EnvironmentId } from '@/types/environment';
import { CLOTHING_BRAND_OPTIONS, type ClothingBrandId } from '@/types/clothingBrand';
import type { LocationId } from '@/types/location';
import type { CityId } from '@/types/city';
import { MANNER_TYPE_LABELS, type MannerTypeId } from '@/types/mannerType';
import { MANNERS_SETTING_OPTIONS, type MannersSettingId } from '@/types/mannersSetting';
import { ID_PREFIX, hasPrefix } from '@/types/idRegistry';
interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

// Re-export SelectableCharacter from useCharacters for backward compatibility
export type { SelectableCharacter } from '@/hooks/useCharacters';
import type { SelectableCharacter } from '@/hooks/useCharacters';

export interface CharacterSelectionData {
  themeId: string;
  characters: SelectableCharacter[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  value: string;
  themeId?: CharacterThemeValue;
  gradeId?: GradeId;
  seasonId?: SeasonId;
  environmentId?: EnvironmentId;
  clothingBrandId?: ClothingBrandId;
  locationId?: LocationId;
  cityId?: CityId;
  mannerTypeId?: MannerTypeId;
  characterSelection?: CharacterSelectionData;
  selectedCharacterIds?: string[]; // IDs of characters selected for enforcement
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  suggestedActions?: SuggestedAction[];
}

export const useGoogleChat = (
  sessionId?: string,
  onMessagesUpdate?: (messages: Message[], sessionId: string) => void,
  gradeLevel?: GradeId, // Changed from kidAge to gradeLevel
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
      selectedCharacterIds?: string[]; // For character enforcement
      gradeLevel?: GradeId | null; // For grade level selection
      season?: SeasonId | null; // For season selection
      environment?: EnvironmentId | null; // For environment selection
      clothingBrand?: ClothingBrandId | null; // For clothing brand selection
      location?: LocationId | null; // For location selection
      city?: CityId | null; // For city selection
      mannerType?: MannerTypeId | null; // For manners book manner type selection
      mannersSetting?: string | null; // For manners book setting (home, school, both)
      discoveryContext?: Record<string, string>; // For frontend-driven discovery flow
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

    // Check if user just selected Bluey theme - intercept and show character selection
    const messageText = displayText || (typeof content === 'string' ? content : '');
    
    // Note: Character selection is now handled externally via useCharacters hook
    // The frontend will inject character selection UI based on theme selection
    // This keeps the hook focused on chat logic only

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
            gradeLevel: context?.gradeLevel || gradeLevel, // Prefer context value for immediate updates
            bookType: context?.bookType || bookType,
            characterTheme: context?.characterTheme,
            selectedCharacterIds: context?.selectedCharacterIds,
            season: context?.season,
            environment: context?.environment,
            clothingBrand: context?.clothingBrand,
            location: context?.location,
            city: context?.city,
            mannerType: context?.mannerType,
            mannersSetting: context?.mannersSetting,
            discoveryContext: context?.discoveryContext,
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
          
          // Grade level fallback  
          if (cleanedText.toLowerCase().includes('grade') || cleanedText.toLowerCase().includes('what grade')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'PRE_K', label: 'Pre-K (Ages 3-4)', value: 'Pre-K', gradeId: 'PRE_K' as GradeId },
                { id: 'K', label: 'Kindergarten (Ages 5-6)', value: 'Kindergarten', gradeId: 'K' as GradeId },
                { id: 'GRADE_1', label: '1st Grade (Ages 6-7)', value: '1st Grade', gradeId: 'GRADE_1' as GradeId },
                { id: 'GRADE_2', label: '2nd Grade (Ages 7-8)', value: '2nd Grade', gradeId: 'GRADE_2' as GradeId },
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

        // Fallback: Digraph agent questions
        if (!match && effectiveBookType === 'digraphs') {
          // Digraph scope selection fallback
          if (cleanedText.includes('multiple digraphs') || cleanedText.includes('specific digraph') || cleanedText.includes('Random Digraphs') || cleanedText.includes('Specific Digraph')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'mixed', label: 'Random Digraphs (variety in one book)', value: 'Random Digraphs' },
                { id: 'specific', label: 'Specific Digraph (master one sound)', value: 'Specific Digraph' },
              ]
            };
          }
          
          // Specific digraph selection fallback
          if (cleanedText.includes('Which specific digraph') || cleanedText.includes('which digraph')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'ch', label: 'ch (chair, cheese)', value: 'ch' },
                { id: 'sh', label: 'sh (ship, shell)', value: 'sh' },
                { id: 'th', label: 'th (think, thumb)', value: 'th' },
                { id: 'wh', label: 'wh (whale, wheel)', value: 'wh' },
                { id: 'ph', label: 'ph (phone, photo)', value: 'ph' },
                { id: 'ck', label: 'ck (duck, sock)', value: 'ck' },
                { id: 'ng', label: 'ng (ring, sing)', value: 'ng' },
                { id: 'gh', label: 'gh (ghost, night)', value: 'gh' },
                { id: 'kn', label: 'kn (knee, knife)', value: 'kn' },
                { id: 'wr', label: 'wr (write, wrist)', value: 'wr' },
                { id: 'qu', label: 'qu (queen, quilt)', value: 'qu' },
                { id: 'sc', label: 'sc (scene, scent)', value: 'sc' },
                { id: 'sk', label: 'sk (sky, skip)', value: 'sk' },
                { id: 'sm', label: 'sm (small, smile)', value: 'sm' },
                { id: 'sn', label: 'sn (snow, snake)', value: 'sn' },
                { id: 'sp', label: 'sp (spin, spot)', value: 'sp' },
                { id: 'st', label: 'st (star, stop)', value: 'st' },
                { id: 'sw', label: 'sw (swim, swing)', value: 'sw' },
                { id: 'tch', label: 'tch (watch, catch)', value: 'tch' },
                { id: 'dge', label: 'dge (badge, edge)', value: 'dge' },
              ]
            };
          }
        }


        if (!match) {
          return { cleanContent: cleanedText, suggestedActions: undefined };
        }
        
        const suggestionsText = match[1].trim();
        const cleanContent = cleanedText.replace(suggestRegex, '').trim();
        
        // Known theme IDs for detection
        const themeIds = new Set([
          'paw-patrol', 'frozen', 'peppa-pig', 'bluey', 'cocomelon', 
          'moana', 'mickey-mouse', 'mario', 'sesame-street', 'benji-davies',
          'black-and-white', 'bear-stories', 'dora', 'little-mermaid'
        ]);

        // Known IDs - use prefix-based detection from ID registry for collision prevention
        // Season IDs now use SEASON_ prefix (e.g., SEASON_WINTER)
        const isSeasonId = (id: string) => hasPrefix(id, ID_PREFIX.SEASON) || SEASON_OPTIONS.some(s => s.id === id);
        const isEnvironmentId = (id: string) => hasPrefix(id, ID_PREFIX.ENVIRONMENT) || ENVIRONMENT_OPTIONS.some(e => e.id === id);
        const isClothingBrandId = (id: string) => hasPrefix(id, ID_PREFIX.CLOTHING_BRAND) || CLOTHING_BRAND_OPTIONS.some(b => b.id === id);
        // Location IDs use LOCATION_ prefix (e.g., LOCATION_VAIL_RESORT)
        const isLocationId = (id: string) => hasPrefix(id, ID_PREFIX.LOCATION) || id === 'skip-location';
        // City IDs use CITY_ prefix (e.g., CITY_JERSEY_CITY)
        const isCityId = (id: string) => hasPrefix(id, ID_PREFIX.CITY) || id === 'skip-city';
        // Manner setting IDs use SETTING_ prefix (e.g., SETTING_home)
        const isMannerSettingId = (id: string) => hasPrefix(id, ID_PREFIX.MANNER_SETTING) || id === 'skip-setting' || MANNERS_SETTING_OPTIONS.some(s => s.id === id);
        const mannerTypeIds: Set<string> = new Set(Object.keys(MANNER_TYPE_LABELS));

        const actions = suggestionsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return null;
            
            const id = line.substring(0, colonIndex).trim();
            const label = line.substring(colonIndex + 1).trim();
            
            // Check if this action represents a character theme
            const isTheme = themeIds.has(id) || themeIds.has(id.toLowerCase());
            
            const action: SuggestedAction = { 
              id, 
              label, 
              value: id === 'custom' ? '' : label,
            };
            if (isTheme) {
              action.themeId = id as CharacterThemeValue;
            }
            // Check for season IDs (prefix-based: SEASON_WINTER)
            if (isSeasonId(id)) {
              action.seasonId = id as SeasonId;
            }
            // Check for environment IDs (prefix-based: ENV_)
            if (isEnvironmentId(id)) {
              action.environmentId = id as EnvironmentId;
            }
            // Check for clothing brand IDs (prefix-based: BRAND_)
            if (isClothingBrandId(id)) {
              action.clothingBrandId = id as ClothingBrandId;
            }
            // Check for location IDs (using pattern matching for database-driven IDs)
            if (isLocationId(id)) {
              action.locationId = id as LocationId;
            }
            // Check for city IDs (using pattern matching for database-driven IDs)
            if (isCityId(id)) {
              action.cityId = id as CityId;
            }
            // Check for manner type IDs (Manners book agent)
            if (mannerTypeIds.has(id)) {
              action.mannerTypeId = id as MannerTypeId;
            }
            return action;
          })
          .filter((action): action is SuggestedAction => action !== null);
        
        console.log('[parseSuggestions] Parsed actions:', actions.map(a => ({ id: a.id, themeId: a.themeId })));
        
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

    } catch (error: any) {
      console.error('Google chat error:', error);
      
      // Create an error message to show the user (keep user message, add error response)
      const errorMessage = error?.message || 'Something went wrong';
      const isPaymentError = errorMessage.includes('payment') || errorMessage.includes('402') || errorMessage.includes('credits');
      
      const errorResponseContent = isPaymentError
        ? "I'm unable to respond right now due to a billing issue. Please check your Lovable AI Gateway credits and try again."
        : `I encountered an error: ${errorMessage}. Please try again.`;
      
      const messagesWithError = [
        ...updatedMessages,
        { 
          role: 'assistant' as const, 
          content: errorResponseContent,
          suggestedActions: [
            { id: 'retry', label: '🔄 Try Again', value: userMessage.content as string }
          ]
        }
      ];
      
      if (sessionId) {
        queryClient.setQueryData(['session-messages', sessionId], messagesWithError);
        // Also persist error state so conversation isn't lost
        if (onMessagesUpdate) {
          onMessagesUpdate(messagesWithError, sessionId);
        }
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
        selectedCharacterIds?: string[];
        gradeLevel?: GradeId | null;
        season?: SeasonId | null;
        environment?: EnvironmentId | null;
        clothingBrand?: ClothingBrandId | null;
        location?: LocationId | null;
        city?: CityId | null;
        mannerType?: MannerTypeId | null;
        mannersSetting?: string | null;
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
