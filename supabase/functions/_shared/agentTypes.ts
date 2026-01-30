/**
 * Dynamic Agent Type Utilities for Edge Functions
 * 
 * Generates AgentType values from the database `book_types` table.
 * This is the single source of truth for book type → agent type mapping.
 * 
 * @sync src/utils/agentTypeUtils.ts for frontend equivalent
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

/**
 * Static types for TypeScript safety - allows known types + any book-creation-* pattern
 */
export type AgentType = 
  | 'chat' 
  | 'book-creation'
  | `book-creation-${string}`;

/**
 * AI provider types - simple enum, no database backing needed
 * @sync src/utils/agentTypeUtils.ts
 */
export type AIProvider = 'openai' | 'deepseek' | 'google';

// Cache for book type mappings (refreshed per invocation or with TTL)
let cachedMapping: Record<string, AgentType> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Fetches book type to agent type mapping from database
 * Uses a 1-minute TTL cache to minimize database queries
 * 
 * @param supabase - Supabase client instance
 * @returns Record mapping book type IDs to agent types
 */
export async function fetchAgentTypeMap(
  supabase: SupabaseClient
): Promise<Record<string, AgentType>> {
  const now = Date.now();
  
  // Return cached mapping if still valid
  if (cachedMapping && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('[AgentTypes] Using cached mapping');
    return cachedMapping;
  }
  
  console.log('[AgentTypes] Fetching fresh mapping from database');
  
  const { data, error } = await supabase
    .from('book_types')
    .select('id, agent_type_suffix')
    .eq('is_active', true);
    
  if (error) {
    console.error('[AgentTypes] Failed to fetch from DB, using fallback:', error.message);
    return FALLBACK_MAPPING;
  }
  
  const mapping: Record<string, AgentType> = {
    'other': 'book-creation', // Fallback always available
  };
  
  for (const row of data || []) {
    const suffix = row.agent_type_suffix || row.id;
    // 'general' maps to generic book-creation
    if (row.id === 'general') {
      mapping[row.id] = 'book-creation';
    } else {
      mapping[row.id] = `book-creation-${suffix}` as AgentType;
    }
  }
  
  // Update cache
  cachedMapping = mapping;
  cacheTimestamp = now;
  
  console.log('[AgentTypes] Cached', Object.keys(mapping).length, 'book type mappings');
  
  return mapping;
}

/**
 * Clears the cached mapping (useful for testing)
 */
export function clearAgentTypeCache(): void {
  cachedMapping = null;
  cacheTimestamp = 0;
}

/**
 * Fallback mapping for when DB is unreachable
 * Contains minimal set of common types to prevent complete failure
 */
const FALLBACK_MAPPING: Record<string, AgentType> = {
  'abc': 'book-creation-abc',
  'numbers': 'book-creation-numbers',
  'rhyming': 'book-creation-rhyming',
  'colors': 'book-creation-colors',
  'shapes': 'book-creation-shapes',
  'animals': 'book-creation-animals',
  'sight-words': 'book-creation-sight-words',
  'emotions': 'book-creation-emotions',
  'cvc': 'book-creation-cvc',
  'opposites': 'book-creation-opposites',
  'first-words': 'book-creation-first-words',
  'bedtime': 'book-creation-bedtime',
  'general': 'book-creation',
  'digraphs': 'book-creation-digraphs',
  'dr-seuss': 'book-creation-dr-seuss',
  'manners': 'book-creation-manners',
  'parent-education': 'book-creation-parent-education',
  'other': 'book-creation',
};
