/**
 * Environment Type System for Book Creation
 * Asked as an optional discovery question
 */

// Environment IDs matching backend constants
export const ENVIRONMENT_IDS = ['CITY', 'SNOWBOARD_RESORT', 'SKI_RESORT', 'ISLAND', 'DESERT', 'MOUNTAIN', 'PARK'] as const;

export type EnvironmentId = typeof ENVIRONMENT_IDS[number];

export interface EnvironmentOption {
  id: EnvironmentId;
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
 * Type guard to check if a string is a valid EnvironmentId
 */
export function isValidEnvironment(value: string): value is EnvironmentId {
  return ENVIRONMENT_IDS.includes(value as EnvironmentId);
}

/**
 * Get display label for an environment ID
 */
export function getEnvironmentLabel(envId: EnvironmentId): string {
  const option = ENVIRONMENT_OPTIONS.find(e => e.id === envId);
  return option?.label || envId;
}

/**
 * Get environment with emoji for display
 */
export function getEnvironmentDisplay(envId: EnvironmentId): string {
  const option = ENVIRONMENT_OPTIONS.find(e => e.id === envId);
  return option ? `${option.emoji} ${option.label}` : envId;
}
