// Environment constants for book creation flow
// Environments are asked as an optional discovery question

export const VALID_ENVIRONMENTS = ['CITY', 'SNOWBOARD_RESORT', 'SKI_RESORT', 'ISLAND', 'DESERT', 'MOUNTAIN', 'PARK'] as const;
export type ValidEnvironment = typeof VALID_ENVIRONMENTS[number];

export interface EnvironmentOption {
  id: ValidEnvironment;
  label: string;
  emoji: string;
  description: string;
}

// Static environment options
export const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  { id: 'CITY', label: 'City', emoji: '🏙️', description: 'Urban streets, buildings, busy life' },
  { id: 'SNOWBOARD_RESORT', label: 'Snowboard Resort', emoji: '🏂', description: 'Halfpipes, terrain parks, lodges' },
  { id: 'SKI_RESORT', label: 'Ski Resort', emoji: '⛷️', description: 'Slopes, chairlifts, ski lodges' },
  { id: 'ISLAND', label: 'Island', emoji: '🏝️', description: 'Beaches, palm trees, ocean views' },
  { id: 'DESERT', label: 'Desert', emoji: '🏜️', description: 'Sand dunes, cacti, open skies' },
  { id: 'MOUNTAIN', label: 'Mountain', emoji: '🏔️', description: 'Peaks, forests, alpine scenery' },
  { id: 'PARK', label: 'Park', emoji: '🌳', description: 'Playgrounds, trees, open spaces' },
];

/**
 * Type guard for valid environment IDs
 */
export function isValidEnvironment(value: string): value is ValidEnvironment {
  return VALID_ENVIRONMENTS.includes(value as ValidEnvironment);
}

/**
 * Get environment label for display
 */
export function getEnvironmentLabel(envId: ValidEnvironment): string {
  const option = ENVIRONMENT_OPTIONS.find(e => e.id === envId);
  return option?.label || envId;
}

/**
 * Get environment with emoji for display
 */
export function getEnvironmentDisplay(envId: ValidEnvironment): string {
  const option = ENVIRONMENT_OPTIONS.find(e => e.id === envId);
  return option ? `${option.emoji} ${option.label}` : envId;
}
