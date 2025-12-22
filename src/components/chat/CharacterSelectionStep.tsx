import React, { useMemo } from 'react';
import type { CharacterFlowState } from '@/hooks/useCharacterSelectionFlow';
import type { Message, SuggestedAction } from '@/hooks/useGoogleChat';

interface CharacterSelectionStepProps {
  flowState: CharacterFlowState;
  messages: Message[];
}

/**
 * Injects CharacterSelector into the last assistant message when flow is ready
 * 
 * This component doesn't render anything directly - it transforms messages
 * to include character selection UI when needed.
 */
export function useCharacterSelectionInjection({
  flowState,
  messages,
}: CharacterSelectionStepProps): Message[] {
  return useMemo(() => {
    if (messages.length === 0) return messages;
    
    // Only inject when flow is 'ready' (theme selected, characters loaded, not yet confirmed)
    if (flowState.status !== 'ready') return messages;
    
    const updatedMessages = [...messages];
    
    // Find the last assistant message to inject into
    for (let i = updatedMessages.length - 1; i >= 0; i--) {
      const msg = updatedMessages[i];
      if (msg.role === 'assistant') {
        // Check if this message already has characterSelection (avoid double injection)
        const hasCharacterSelection = msg.suggestedActions?.some(
          (a: SuggestedAction) => a.characterSelection
        );
        
        if (!hasCharacterSelection) {
          updatedMessages[i] = {
            ...msg,
            suggestedActions: [
              {
                id: 'character-selection',
                label: 'Select Characters',
                value: '',
                themeId: flowState.themeId,
                characterSelection: {
                  themeId: flowState.themeId!,
                  characters: flowState.characters,
                },
              },
            ],
          };
          return updatedMessages;
        }
        break; // Stop after first assistant message
      }
    }
    
    return messages;
  }, [messages, flowState.status, flowState.themeId, flowState.characters]);
}

export default useCharacterSelectionInjection;
