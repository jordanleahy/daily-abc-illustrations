/**
 * Season Type System for Book Creation
 * Asked as the final discovery question before outline generation
 */

// Season IDs matching backend constants
export const SEASON_IDS = ['SPRING', 'SUMMER', 'FALL', 'WINTER'] as const;

export type SeasonId = typeof SEASON_IDS[number];

export interface SeasonOption {
  id: SeasonId;
  label: string;
  emoji: string;
  description: string;
}

// Static season options
export const SEASON_OPTIONS: SeasonOption[] = [
  { id: 'SPRING', label: 'Spring', emoji: '🌸', description: 'Flowers, rain, new growth' },
  { id: 'SUMMER', label: 'Summer', emoji: '☀️', description: 'Sun, beaches, outdoor fun' },
  { id: 'FALL', label: 'Fall', emoji: '🍂', description: 'Leaves, harvest, cozy vibes' },
  { id: 'WINTER', label: 'Winter', emoji: '❄️', description: 'Snow, holidays, warm indoors' },
];

/**
 * Type guard to check if a string is a valid SeasonId
 */
export function isValidSeason(value: string): value is SeasonId {
  return SEASON_IDS.includes(value as SeasonId);
}

/**
 * Get display label for a season ID
 */
export function getSeasonLabel(seasonId: SeasonId): string {
  const option = SEASON_OPTIONS.find(s => s.id === seasonId);
  return option?.label || seasonId;
}

/**
 * Get season with emoji for display
 */
export function getSeasonDisplay(seasonId: SeasonId): string {
  const option = SEASON_OPTIONS.find(s => s.id === seasonId);
  return option ? `${option.emoji} ${option.label}` : seasonId;
}
