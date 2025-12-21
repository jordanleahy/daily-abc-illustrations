import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CharacterThemeValue } from '@/types/characterTheme';

export interface Character {
  id: string;
  theme_id: string;
  name: string;
  description: string;
  constraint_text: string | null;
  thumbnail_url: string | null;
  default_selected: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface SelectableCharacter {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  defaultSelected?: boolean;
}

/**
 * Hook to fetch characters for a specific theme
 * Uses aggressive caching (24-hour stale time) for optimal performance
 */
export function useCharacters(themeId: CharacterThemeValue | string | null) {
  return useQuery({
    queryKey: ['characters', themeId],
    queryFn: async (): Promise<Character[]> => {
      if (!themeId || themeId === 'no-theme' || themeId === 'custom') {
        return [];
      }

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('theme_id', themeId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[useCharacters] Error fetching characters:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!themeId && themeId !== 'no-theme' && themeId !== 'custom',
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - characters rarely change
    gcTime: 48 * 60 * 60 * 1000, // 48 hours cache time
  });
}

/**
 * Build constraint text from selected character IDs
 * Pre-joins constraints for session storage - zero runtime computation
 */
export function buildConstraintText(characters: Character[], selectedIds: string[]): string {
  const selected = characters.filter(c => selectedIds.includes(c.id));
  if (selected.length === 0) return '';

  const charList = selected
    .map(c => `- ${c.name}: ${c.constraint_text || c.description}`)
    .join('\n');

  return `
⚠️ CHARACTER RESTRICTIONS - STRICTLY ENFORCED:
ONLY the following characters may appear in this book:
${charList}

DO NOT include ANY other characters, animals, or named figures.
All characters not listed above are FORBIDDEN.
`;
}

/**
 * Convert Character to SelectableCharacter format for UI components
 */
export function toSelectableCharacter(character: Character) {
  return {
    id: character.id,
    name: character.name,
    description: character.description,
    thumbnail: character.thumbnail_url || undefined,
    defaultSelected: character.default_selected,
  };
}
