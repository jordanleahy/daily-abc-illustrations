import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type { CharacterThemeValue } from '@/types/characterTheme';
import type { BookTypeId } from '@/types/bookType';
import type { GradeId } from '@/types/grade';
import type { SeasonId } from '@/types/season';
import type { EnvironmentId } from '@/types/environment';
import type { ClothingBrandId } from '@/types/clothingBrand';
import type { LocationId } from '@/types/location';
import type { CityId } from '@/types/city';
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
            city: context?.city
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

        // Generic fallbacks for common discovery patterns across all book types
        if (!match) {
          // Grade level selection fallback
          if (cleanedText.toLowerCase().includes('grade level') || cleanedText.toLowerCase().includes('what grade') || cleanedText.toLowerCase().includes('which grade')) {
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

          // Page count selection fallback
          if (cleanedText.toLowerCase().includes('how many') && (cleanedText.toLowerCase().includes('page') || cleanedText.toLowerCase().includes('content'))) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'pages-5', label: '5 pages (quick intro)', value: '5 pages' },
                { id: 'pages-10', label: '10 pages (standard)', value: '10 pages' },
                { id: 'pages-15', label: '15 pages (comprehensive)', value: '15 pages' },
                { id: 'pages-20', label: '20 pages (deep dive)', value: '20 pages' },
              ]
            };
          }

          // Title/description approval fallback
          if (cleanedText.includes('Looks great') || cleanedText.includes('approve') || cleanedText.includes('sound good') || cleanedText.includes('look good')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'approve', label: '✓ Looks great!', value: 'Looks great!' },
                { id: 'edit-title', label: 'Edit title', value: 'Edit title' },
                { id: 'edit-description', label: 'Edit description', value: 'Edit description' },
              ]
            };
          }

          // Season selection fallback - asked as final discovery question (optional)
          if (cleanedText.toLowerCase().includes('season') || cleanedText.toLowerCase().includes('time of year')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'SPRING', label: '🌸 Spring', value: 'Spring', seasonId: 'SPRING' as SeasonId },
                { id: 'SUMMER', label: '☀️ Summer', value: 'Summer', seasonId: 'SUMMER' as SeasonId },
                { id: 'FALL', label: '🍂 Fall', value: 'Fall', seasonId: 'FALL' as SeasonId },
                { id: 'WINTER', label: '❄️ Winter', value: 'Winter', seasonId: 'WINTER' as SeasonId },
                { id: 'skip-season', label: '⏭️ Skip', value: 'No specific season' },
              ]
            };
          }

          // Environment selection fallback - optional discovery question
          if (cleanedText.toLowerCase().includes('environment') || cleanedText.toLowerCase().includes('setting') || cleanedText.toLowerCase().includes('location') || cleanedText.toLowerCase().includes('where should')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'CITY', label: '🏙️ City', value: 'City', environmentId: 'CITY' as EnvironmentId },
                { id: 'SNOWBOARD_RESORT', label: '🏂 Snowboard Resort', value: 'Snowboard Resort', environmentId: 'SNOWBOARD_RESORT' as EnvironmentId },
                { id: 'SKI_RESORT', label: '⛷️ Ski Resort', value: 'Ski Resort', environmentId: 'SKI_RESORT' as EnvironmentId },
                { id: 'ISLAND', label: '🏝️ Island', value: 'Island', environmentId: 'ISLAND' as EnvironmentId },
                { id: 'DESERT', label: '🏜️ Desert', value: 'Desert', environmentId: 'DESERT' as EnvironmentId },
                { id: 'MOUNTAIN', label: '🏔️ Mountain', value: 'Mountain', environmentId: 'MOUNTAIN' as EnvironmentId },
                { id: 'PARK', label: '🌳 Park', value: 'Park', environmentId: 'PARK' as EnvironmentId },
                { id: 'skip-environment', label: '⏭️ Skip', value: 'No specific environment' },
              ]
            };
          }

          // Clothing brand selection fallback - optional discovery question for character attire
          if (cleanedText.toLowerCase().includes('clothing brand') || cleanedText.toLowerCase().includes('branded clothing') || cleanedText.toLowerCase().includes('wear branded')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'BURTON', label: '🏂 Burton', value: 'Burton', clothingBrandId: 'BURTON' as ClothingBrandId },
                { id: 'NONE', label: '👕 No brand', value: 'No brand', clothingBrandId: 'NONE' as ClothingBrandId },
                { id: 'skip-clothing-brand', label: '⏭️ Skip', value: 'No specific brand' },
              ]
            };
          }

          // Location selection fallback - optional discovery question for specific resort (FINAL question before outline)
          if (cleanedText.toLowerCase().includes('resort') || 
              cleanedText.toLowerCase().includes('which resort') || 
              cleanedText.toLowerCase().includes('specific resort') ||
              cleanedText.toLowerCase().includes('specific location') ||
              cleanedText.toLowerCase().includes('set this book at')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'VAIL_RESORT', label: '🏔️ Vail Resort', value: 'Vail Resort', locationId: 'VAIL_RESORT' as LocationId },
                { id: 'SUGARBUSH_RESORT', label: '🍁 Sugarbush Resort', value: 'Sugarbush Resort', locationId: 'SUGARBUSH_RESORT' as LocationId },
                { id: 'STRATTON', label: '⛷️ Stratton', value: 'Stratton', locationId: 'STRATTON' as LocationId },
                { id: 'KILLINGTON', label: '🏂 Killington', value: 'Killington', locationId: 'KILLINGTON' as LocationId },
                { id: 'MOUNTAIN_CREEK', label: '🎿 Mountain Creek', value: 'Mountain Creek', locationId: 'MOUNTAIN_CREEK' as LocationId },
                { id: 'COPPER_MOUNTAIN', label: '🥉 Copper Mountain', value: 'Copper Mountain', locationId: 'COPPER_MOUNTAIN' as LocationId },
                { id: 'BRECKENRIDGE', label: '🏘️ Breckenridge', value: 'Breckenridge', locationId: 'BRECKENRIDGE' as LocationId },
                { id: 'KEYSTONE', label: '🌙 Keystone', value: 'Keystone', locationId: 'KEYSTONE' as LocationId },
                { id: 'skip-location', label: '⏭️ Skip (no specific resort)', value: 'No specific resort', locationId: 'NONE' as LocationId },
              ]
            };
          }

          // City selection fallback - optional discovery question for urban setting
          if (cleanedText.toLowerCase().includes('specific city') || 
              cleanedText.toLowerCase().includes('which city') || 
              cleanedText.toLowerCase().includes('set this book in a specific city')) {
            return { 
              cleanContent: cleanedText, 
              suggestedActions: [
                { id: 'JERSEY_CITY', label: '🌅 Jersey City', value: 'Jersey City', cityId: 'JERSEY_CITY' as CityId },
                { id: 'HOBOKEN', label: '🚂 Hoboken', value: 'Hoboken', cityId: 'HOBOKEN' as CityId },
                { id: 'NEW_YORK_CITY', label: '🗽 New York City', value: 'New York City', cityId: 'NEW_YORK_CITY' as CityId },
                { id: 'skip-city', label: '⏭️ Skip (no specific city)', value: 'No specific city', cityId: 'NONE' as CityId },
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

        // Known season IDs
        const seasonIds = new Set(['SPRING', 'SUMMER', 'FALL', 'WINTER']);

        // Known environment IDs
        const environmentIds = new Set(['CITY', 'SNOWBOARD_RESORT', 'SKI_RESORT', 'ISLAND', 'DESERT', 'MOUNTAIN', 'PARK']);

        // Known clothing brand IDs
        const clothingBrandIds = new Set(['BURTON', 'NONE']);

        // Known location IDs (includes skip-location and NONE to prevent re-asking)
        const locationIds = new Set(['VAIL_RESORT', 'SUGARBUSH_RESORT', 'STRATTON', 'KILLINGTON', 'MOUNTAIN_CREEK', 'COPPER_MOUNTAIN', 'BRECKENRIDGE', 'KEYSTONE', 'WHISTLER_BLACKCOMB', 'skip-location', 'NONE']);

        // Known city IDs
        const cityIds = new Set(['JERSEY_CITY', 'HOBOKEN', 'NEW_YORK_CITY', 'skip-city', 'NONE']);

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
            // Check for season IDs
            if (seasonIds.has(id)) {
              action.seasonId = id as SeasonId;
            }
            // Check for environment IDs
            if (environmentIds.has(id)) {
              action.environmentId = id as EnvironmentId;
            }
            // Check for clothing brand IDs
            if (clothingBrandIds.has(id)) {
              action.clothingBrandId = id as ClothingBrandId;
            }
            // Check for location IDs
            if (locationIds.has(id)) {
              action.locationId = id as LocationId;
            }
            // Check for city IDs
            if (cityIds.has(id)) {
              action.cityId = id as CityId;
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
