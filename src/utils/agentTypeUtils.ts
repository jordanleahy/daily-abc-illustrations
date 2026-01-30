/**
 * Dynamic Agent Type Utilities
 * 
 * Generates AgentType values from the database `book_types` table.
 * This is the single source of truth for book type → agent type mapping.
 * 
 * @see supabase/functions/_shared/agentTypes.ts for backend equivalent
 */

import type { DatabaseBookType } from '@/hooks/useBookTypes';

/**
 * Static fallback types for TypeScript (used before DB loads)
 * These provide IDE autocomplete while allowing dynamic runtime types
 */
export const STATIC_AGENT_TYPES = [
  'chat',
  'book-creation',
  'book-creation-numbers',
  'book-creation-rhyming',
  'book-creation-colors',
  'book-creation-abc',
  'book-creation-shapes',
  'book-creation-animals',
  'book-creation-sight-words',
  'book-creation-emotions',
  'book-creation-cvc',
  'book-creation-opposites',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-general',
  'book-creation-digraphs',
  'book-creation-dr-seuss',
  'book-creation-manners',
  'book-creation-parent-education',
] as const;

export type StaticAgentType = typeof STATIC_AGENT_TYPES[number];

/**
 * Dynamic agent type - allows static known types + any book-creation-* pattern
 * This enables runtime flexibility while maintaining type safety
 */
export type AgentType = StaticAgentType | `book-creation-${string}`;

/**
 * AI provider types - simple enum, no database backing needed
 * @sync supabase/functions/_shared/agentTypes.ts
 */
export type AIProvider = 'openai' | 'deepseek' | 'google';

/**
 * Static fallback mapping for SSR/initial render
 * Used when database hasn't loaded yet
 */
export const STATIC_BOOK_TYPE_TO_AGENT_TYPE: Record<string, AgentType> = {
  'numbers': 'book-creation-numbers',
  'rhyming': 'book-creation-rhyming',
  'colors': 'book-creation-colors',
  'abc': 'book-creation-abc',
  'shapes': 'book-creation-shapes',
  'animals': 'book-creation-animals',
  'sight-words': 'book-creation-sight-words',
  'emotions': 'book-creation-emotions',
  'cvc': 'book-creation-cvc',
  'opposites': 'book-creation-opposites',
  'first-words': 'book-creation-first-words',
  'bedtime': 'book-creation-bedtime',
  'general': 'book-creation-general',
  'digraphs': 'book-creation-digraphs',
  'dr-seuss': 'book-creation-dr-seuss',
  'manners': 'book-creation-manners',
  'parent-education': 'book-creation-parent-education',
  'other': 'book-creation',
} as const;

/**
 * Generates agent type from book type ID
 * Uses the suffix if provided, otherwise derives from ID
 * 
 * @param bookTypeId - The book type identifier (e.g., 'abc', 'numbers')
 * @param suffix - Optional explicit suffix from database
 * @returns The computed AgentType
 */
export function bookTypeToAgentType(bookTypeId: string, suffix?: string | null): AgentType {
  // 'other' and 'general' map to generic book-creation
  if (bookTypeId === 'other' || bookTypeId === 'general') {
    return 'book-creation';
  }
  return `book-creation-${suffix || bookTypeId}` as AgentType;
}

/**
 * Builds BOOK_TYPE_TO_AGENT_TYPE mapping from database records
 * This enables dynamic mapping that stays in sync with the database
 * 
 * @param bookTypes - Array of database book type records
 * @returns Record mapping book type IDs to agent types
 */
export function buildAgentTypeMap(bookTypes: DatabaseBookType[]): Record<string, AgentType> {
  const map: Record<string, AgentType> = {
    'other': 'book-creation', // Fallback always available
  };
  
  for (const bt of bookTypes) {
    map[bt.id] = bookTypeToAgentType(bt.id, bt.agent_type_suffix);
  }
  
  return map;
}

/**
 * Type guard to check if a string is a valid AgentType
 */
export function isValidAgentType(value: string): value is AgentType {
  return value === 'chat' || 
         value === 'book-creation' || 
         value.startsWith('book-creation-');
}
