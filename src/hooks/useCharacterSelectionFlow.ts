import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCharacterThemes, CharacterTheme } from './useCharacterThemes';
import { useCharacters, Character, toSelectableCharacter, SelectableCharacter } from './useCharacters';
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
  detectThemeFromText: (input: string) => boolean; // Returns true if theme was detected
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
 * - Prefetches themes on mount for instant text detection
 * - Manages async character loading
 * - Single source of truth for character selection state
 */
export function useCharacterSelectionFlow(): UseCharacterSelectionFlowReturn {
  const queryClient = useQueryClient();
  
  // Internal state
  const [themeId, setThemeId] = useState<CharacterThemeValue | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Fetch all themes for text detection (with aggressive caching)
  const { data: allThemes = [] } = useCharacterThemes();
  
  // Fetch characters for selected theme
  const { data: characters = [], isLoading: charactersLoading } = useCharacters(themeId);
  
  // Prefetch themes on mount for reliable text-based detection
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['character-themes', { includeInactive: false }],
      queryFn: async () => {
        const { data } = await supabase
          .from('character_themes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        return data || [];
      },
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
  }, [queryClient]);
  
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
   * Detect theme from user text input
   * Returns true if a theme was detected and selected
   */
  const detectThemeFromText = useCallback((input: string): boolean => {
    if (!input || themeId) return false; // Already have a theme
    
    const lower = input.toLowerCase().trim();
    
    const match = allThemes.find((t: CharacterTheme) => 
      lower === t.display_name.toLowerCase() ||
      lower === t.id.toLowerCase()
    );
    
    console.log('[CharacterFlow] Theme detection:', {
      input: lower,
      themesLoaded: allThemes.length,
      matchFound: !!match,
    });
    
    if (match) {
      console.log('[CharacterFlow] ✅ Detected theme from text:', match.id);
      selectTheme(match.id as CharacterThemeValue);
      return true;
    }
    
    return false;
  }, [allThemes, themeId, selectTheme]);
  
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
    detectThemeFromText,
    confirmSelection,
    reset,
    needsCharacterSelection,
    themeId,
    selectedCharacterIds,
  };
}
