import { useState, useCallback, useMemo } from 'react';
import { useCharacters, toSelectableCharacter, SelectableCharacter } from './useCharacters';
import type { CharacterThemeValue } from '@/types/characterTheme';

// ========================
// STATE MACHINE TYPES
// ========================

export type CharacterFlowStatus = 
  | 'idle'           // No theme selected
  | 'theme-selected' // Theme chosen, loading characters
  | 'ready'          // Characters loaded, awaiting user selection
  | 'confirmed';     // User confirmed character selection

export interface CharacterFlowState {
  status: CharacterFlowStatus;
  themeId: CharacterThemeValue | null;
  characters: SelectableCharacter[];
  selectedCharacterIds: string[];
  isLoading: boolean;
}

export interface UseCharacterSelectionFlowReturn {
  // Current state
  state: CharacterFlowState;
  
  // Actions
  selectTheme: (themeId: CharacterThemeValue) => void;
  confirmSelection: (characterIds: string[]) => void;
  reset: () => void;
  
  // Convenience getters
  needsCharacterSelection: boolean;
  themeId: CharacterThemeValue | null;
  selectedCharacterIds: string[];
}

/**
 * State machine hook for character selection flow
 * 
 * Flow: idle → theme-selected → ready → confirmed
 * 
 * Features:
 * - Manages async character loading when theme is selected
 * - Single source of truth for character selection state
 */
export function useCharacterSelectionFlow(): UseCharacterSelectionFlowReturn {
  // Internal state
  const [themeId, setThemeId] = useState<CharacterThemeValue | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Fetch characters for selected theme
  const { data: characters = [], isLoading: charactersLoading } = useCharacters(themeId);
  
  // Derive current status from state
  const status = useMemo((): CharacterFlowStatus => {
    if (!themeId) return 'idle';
    if (isConfirmed && selectedCharacterIds.length > 0) return 'confirmed';
    if (!charactersLoading && characters.length > 0) return 'ready';
    return 'theme-selected';
  }, [themeId, isConfirmed, selectedCharacterIds.length, charactersLoading, characters.length]);
  
  // Convert characters to selectable format
  const selectableCharacters = useMemo(() => {
    return characters.map(toSelectableCharacter);
  }, [characters]);
  
  // Build full state object
  const state: CharacterFlowState = useMemo(() => ({
    status,
    themeId,
    characters: selectableCharacters,
    selectedCharacterIds,
    isLoading: charactersLoading,
  }), [status, themeId, selectableCharacters, selectedCharacterIds, charactersLoading]);
  
  // ========================
  // ACTIONS
  // ========================
  
  /**
   * Select a theme (from button click or text detection)
   */
  const selectTheme = useCallback((newThemeId: CharacterThemeValue) => {
    console.log('[CharacterFlow] Theme selected:', newThemeId);
    setThemeId(newThemeId);
    setSelectedCharacterIds([]);
    setIsConfirmed(false);
  }, []);
  
  
  /**
   * Confirm character selection
   */
  const confirmSelection = useCallback((characterIds: string[]) => {
    console.log('[CharacterFlow] Characters confirmed:', characterIds);
    setSelectedCharacterIds(characterIds);
    setIsConfirmed(true);
  }, []);
  
  /**
   * Reset the entire flow (for new sessions)
   */
  const reset = useCallback(() => {
    console.log('[CharacterFlow] Reset');
    setThemeId(null);
    setSelectedCharacterIds([]);
    setIsConfirmed(false);
  }, []);
  
  // Convenience getter
  const needsCharacterSelection = status === 'ready';
  
  return {
    state,
    selectTheme,
    confirmSelection,
    reset,
    needsCharacterSelection,
    themeId,
    selectedCharacterIds,
  };
}
