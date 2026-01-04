import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

interface Character {
  id: string;
  name: string;
  description: string;
  constraint_text: string | null;
}

/**
 * Themes where characters are universally recognized by AI models.
 * For these themes, we only output character names (no descriptions)
 * to avoid confusing the model with redundant/conflicting descriptions.
 */
export const NAME_ONLY_THEMES = new Set([
  'bluey',
  'frozen',
  'paw-patrol',
  'peppa-pig',
  'cocomelon',
  'moana',
  'mickey-mouse',
  'mario',
  'sesame-street',
  'dora',
  'little-mermaid',
]);

// In-memory cache for characters (per cold start)
const characterCache = new Map<string, { characters: Character[]; cachedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch characters for a theme from database with caching
 * Uses singleton pattern per cold start to avoid repeated DB hits
 */
export async function fetchCharactersForTheme(
  supabase: ReturnType<typeof createClient>,
  themeId: string
): Promise<Character[]> {
  // Check cache first
  const cached = characterCache.get(themeId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    console.log(`📋 Using cached characters for theme: ${themeId}`);
    return cached.characters;
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, description, constraint_text')
    .eq('theme_id', themeId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(`❌ Error fetching characters for theme ${themeId}:`, error);
    return [];
  }

  const characters = data || [];
  
  // Update cache
  characterCache.set(themeId, { characters, cachedAt: Date.now() });
  console.log(`✅ Cached ${characters.length} characters for theme: ${themeId}`);
  
  return characters;
}

/**
 * Build character constraint text from selected character IDs
 * Queries database for constraint_text, falling back to description
 */
export async function buildCharacterConstraints(
  supabase: ReturnType<typeof createClient>,
  themeId: string,
  selectedCharacterIds: string[]
): Promise<string> {
  if (!themeId || !selectedCharacterIds?.length) {
    return '';
  }

  const characters = await fetchCharactersForTheme(supabase, themeId);
  const selected = characters.filter(c => selectedCharacterIds.includes(c.id));
  
  if (selected.length === 0) {
    console.log(`⚠️ No matching characters found for IDs: ${selectedCharacterIds.join(', ')}`);
    return '';
  }

  // Use name-only format for well-known themes
  const useNameOnly = NAME_ONLY_THEMES.has(themeId);
  
  const charList = selected
    .map(c => useNameOnly 
      ? `- ${c.name}` 
      : `- ${c.name}: ${c.constraint_text || c.description}`)
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
 * Clear the character cache (useful for testing or admin operations)
 */
export function clearCharacterCache(): void {
  characterCache.clear();
  console.log('🗑️ Character cache cleared');
}
