// Season constants for book creation flow
// Seasons are asked as the final discovery question before outline generation

export const VALID_SEASONS = ['SPRING', 'SUMMER', 'FALL', 'WINTER'] as const;
export type ValidSeason = typeof VALID_SEASONS[number];

export interface SeasonOption {
  id: ValidSeason;
  label: string;
  emoji: string;
  description: string;
}

// Static season options (no database needed - seasons don't change!)
export const SEASON_OPTIONS: SeasonOption[] = [
  { id: 'SPRING', label: 'Spring', emoji: '🌸', description: 'Flowers, rain, new growth' },
  { id: 'SUMMER', label: 'Summer', emoji: '☀️', description: 'Sun, beaches, outdoor fun' },
  { id: 'FALL', label: 'Fall', emoji: '🍂', description: 'Leaves, harvest, cozy vibes' },
  { id: 'WINTER', label: 'Winter', emoji: '❄️', description: 'Snow, holidays, warm indoors' },
];

/**
 * Type guard for valid season IDs
 */
export function isValidSeason(value: string): value is ValidSeason {
  return VALID_SEASONS.includes(value as ValidSeason);
}

/**
 * Get season label for display
 */
export function getSeasonLabel(seasonId: ValidSeason): string {
  const option = SEASON_OPTIONS.find(s => s.id === seasonId);
  return option?.label || seasonId;
}

/**
 * Get season with emoji for display
 */
export function getSeasonDisplay(seasonId: ValidSeason): string {
  const option = SEASON_OPTIONS.find(s => s.id === seasonId);
  return option ? `${option.emoji} ${option.label}` : seasonId;
}

/**
 * Generates [SUGGEST] block format for season selection in chat
 */
export function getSeasonSuggestions(): string {
  const suggestions = SEASON_OPTIONS
    .map(s => `${s.id}: ${s.emoji} ${s.label}`)
    .join('\n');
  
  return `[SUGGEST]\n${suggestions}\n[/SUGGEST]`;
}
