/**
 * Season Type System for Book Creation
 * Asked as the final discovery question before outline generation
 * 
 * Uses prefixed IDs (SEASON_WINTER) to prevent collisions with other ID types
 */

import { ID_PREFIX, hasPrefix, removePrefix } from './idRegistry';

// Season IDs with namespace prefix
export const SEASON_IDS = [
  'SEASON_SPRING', 
  'SEASON_SUMMER', 
  'SEASON_FALL', 
  'SEASON_WINTER'
] as const;

export type SeasonId = typeof SEASON_IDS[number];

export interface SeasonOption {
  id: SeasonId;
  label: string;
  emoji: string;
  description: string;
}

// Static season options with prefixed IDs
export const SEASON_OPTIONS: SeasonOption[] = [
  { id: 'SEASON_SPRING', label: 'Spring', emoji: '🌸', description: 'Flowers, rain, new growth' },
  { id: 'SEASON_SUMMER', label: 'Summer', emoji: '☀️', description: 'Sun, beaches, outdoor fun' },
  { id: 'SEASON_FALL', label: 'Fall', emoji: '🍂', description: 'Leaves, harvest, cozy vibes' },
  { id: 'SEASON_WINTER', label: 'Winter', emoji: '❄️', description: 'Snow, holidays, warm indoors' },
];

/**
 * Type guard to check if a string is a valid SeasonId
 */
export function isValidSeason(value: string): value is SeasonId {
  return SEASON_IDS.includes(value as SeasonId) || hasPrefix(value, ID_PREFIX.SEASON);
}

/**
 * Normalize legacy season ID to prefixed format
 */
export function normalizeSeasonId(id: string): SeasonId | null {
  // Already prefixed
  if (SEASON_IDS.includes(id as SeasonId)) return id as SeasonId;
  
  // Legacy format - add prefix
  const legacyMap: Record<string, SeasonId> = {
    'WINTER': 'SEASON_WINTER',
    'SPRING': 'SEASON_SPRING',
    'SUMMER': 'SEASON_SUMMER',
    'FALL': 'SEASON_FALL',
  };
  
  return legacyMap[id] || null;
}

/**
 * Get display label for a season ID
 */
export function getSeasonLabel(seasonId: SeasonId | string): string {
  const normalized = normalizeSeasonId(seasonId) || seasonId;
  const option = SEASON_OPTIONS.find(s => s.id === normalized);
  if (option) return option.label;
  
  // Fallback: remove prefix and capitalize
  const raw = removePrefix(seasonId, ID_PREFIX.SEASON);
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * Get season with emoji for display
 */
export function getSeasonDisplay(seasonId: SeasonId | string): string {
  const normalized = normalizeSeasonId(seasonId) || seasonId;
  const option = SEASON_OPTIONS.find(s => s.id === normalized);
  return option ? `${option.emoji} ${option.label}` : seasonId;
}
