/**
 * City Type System for Book Creation
 * Asked as an optional discovery question after the resort location question
 */

// City IDs for specific urban areas
export const CITY_IDS = [
  'JERSEY_CITY',
  'HOBOKEN',
  'NEW_YORK_CITY',
  'NONE' // Represents "skipped" - no specific city
] as const;

export type CityId = typeof CITY_IDS[number];

export interface CityOption {
  id: CityId;
  label: string;
  emoji: string;
  description: string;
}

// Static city options
export const CITY_OPTIONS: CityOption[] = [
  { id: 'JERSEY_CITY', label: 'Jersey City', emoji: '🌅', description: 'NJ, waterfront views, diverse neighborhoods' },
  { id: 'HOBOKEN', label: 'Hoboken', emoji: '🚂', description: 'NJ, historic mile-square city' },
  { id: 'NEW_YORK_CITY', label: 'New York City', emoji: '🗽', description: 'The Big Apple, iconic landmarks' },
];

/**
 * Type guard to check if a string is a valid CityId
 */
export function isValidCity(value: string): value is CityId {
  return CITY_IDS.includes(value as CityId);
}

/**
 * Get display label for a city ID
 */
export function getCityLabel(cityId: CityId): string {
  const option = CITY_OPTIONS.find(c => c.id === cityId);
  return option?.label || cityId;
}

/**
 * Get city with emoji for display
 */
export function getCityDisplay(cityId: CityId): string {
  const option = CITY_OPTIONS.find(c => c.id === cityId);
  return option ? `${option.emoji} ${option.label}` : cityId;
}
