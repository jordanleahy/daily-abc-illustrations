import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface DiscoveryOption {
  key: string;
  label: string;
}

export interface TypeSpecificDiscovery {
  id: string;
  agent_type: string;
  question_key: string;
  question_text: string;
  options: DiscoveryOption[];
  sort_order: number;
  is_active: boolean;
}

// In-memory cache for type-specific discoveries
let discoveriesCache: Map<string, TypeSpecificDiscovery[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch type-specific discoveries from database with caching
 */
export async function fetchTypeDiscoveries(
  supabaseUrl: string,
  supabaseKey: string,
  agentType?: string
): Promise<TypeSpecificDiscovery[]> {
  const now = Date.now();
  
  // Return from cache if valid
  if (discoveriesCache && now - cacheTimestamp < CACHE_TTL_MS) {
    if (agentType) {
      return discoveriesCache.get(agentType) || [];
    }
    // Return all discoveries flattened
    const all: TypeSpecificDiscovery[] = [];
    discoveriesCache.forEach((discoveries) => all.push(...discoveries));
    return all;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('type_specific_discoveries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching type discoveries:', error);
      return getDefaultDiscoveries(agentType);
    }

    // Build cache map by agent_type
    discoveriesCache = new Map();
    for (const discovery of data || []) {
      const existing = discoveriesCache.get(discovery.agent_type) || [];
      existing.push({
        ...discovery,
        options: discovery.options as DiscoveryOption[]
      });
      discoveriesCache.set(discovery.agent_type, existing);
    }
    cacheTimestamp = now;

    if (agentType) {
      return discoveriesCache.get(agentType) || [];
    }
    
    const all: TypeSpecificDiscovery[] = [];
    discoveriesCache.forEach((discoveries) => all.push(...discoveries));
    return all;
  } catch (err) {
    console.error('Exception fetching type discoveries:', err);
    return getDefaultDiscoveries(agentType);
  }
}

/**
 * Format discoveries as [SUGGEST] blocks for chat prompts
 */
export function getDiscoverySuggestions(discoveries: TypeSpecificDiscovery[]): string {
  if (!discoveries.length) return '';

  return discoveries.map(discovery => {
    const optionsText = discovery.options
      .map(opt => `${opt.key}: ${opt.label}`)
      .join('\n');
    
    return `${discovery.question_text}\n\n[SUGGEST]\n${optionsText}\n[/SUGGEST]`;
  }).join('\n\n');
}

/**
 * Get discovery questions for a specific agent type formatted for prompts
 */
export async function getAgentDiscoveryPrompt(
  supabaseUrl: string,
  supabaseKey: string,
  agentType: string
): Promise<string> {
  const discoveries = await fetchTypeDiscoveries(supabaseUrl, supabaseKey, agentType);
  return getDiscoverySuggestions(discoveries);
}

/**
 * Default discoveries fallback
 */
function getDefaultDiscoveries(agentType?: string): TypeSpecificDiscovery[] {
  const defaults: TypeSpecificDiscovery[] = [
    {
      id: 'default-abc-theme',
      agent_type: 'abc',
      question_key: 'subject_theme',
      question_text: 'What subject theme would you like for your ABC book?',
      options: [
        { key: 'mountain-village', label: '🏔️ Mountain Village A-Z' },
        { key: 'animals', label: '🐾 Animals A-Z' },
        { key: 'custom', label: '✏️ Custom Theme' }
      ],
      sort_order: 1,
      is_active: true
    },
    {
      id: 'default-abc-case',
      agent_type: 'abc',
      question_key: 'letter_case',
      question_text: 'What letter case would you prefer?',
      options: [
        { key: 'lowercase', label: 'lowercase (a, b, c)' },
        { key: 'uppercase', label: 'UPPERCASE (A, B, C)' },
        { key: 'mixed', label: 'Mixed Case (Aa, Bb, Cc)' }
      ],
      sort_order: 2,
      is_active: true
    }
  ];

  if (agentType) {
    return defaults.filter(d => d.agent_type === agentType);
  }
  return defaults;
}

/**
 * Clear cache (useful for testing or after admin updates)
 */
export function clearDiscoveriesCache(): void {
  discoveriesCache = null;
  cacheTimestamp = 0;
}
