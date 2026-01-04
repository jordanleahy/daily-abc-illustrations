/**
 * Location Type System for Book Creation
 * Asked as an optional discovery question at the end of the flow
 */

// Location IDs for specific ski/snowboard resorts
export const LOCATION_IDS = [
  'VAIL_RESORT',
  'SUGARBUSH_RESORT',
  'STRATTON',
  'KILLINGTON',
  'MOUNTAIN_CREEK',
  'COPPER_MOUNTAIN',
  'BRECKENRIDGE',
  'KEYSTONE',
  'NONE' // Represents "skipped" - no specific location
] as const;

export type LocationId = typeof LOCATION_IDS[number];

export interface LocationOption {
  id: LocationId;
  label: string;
  emoji: string;
  description: string;
}

// Static location options
export const LOCATION_OPTIONS: LocationOption[] = [
  { id: 'VAIL_RESORT', label: 'Vail Resort', emoji: '🏔️', description: 'Colorado, world-class terrain' },
  { id: 'SUGARBUSH_RESORT', label: 'Sugarbush Resort', emoji: '🍁', description: 'Vermont, classic New England' },
  { id: 'STRATTON', label: 'Stratton', emoji: '⛷️', description: 'Vermont, family-friendly' },
  { id: 'KILLINGTON', label: 'Killington Mountain', emoji: '🏂', description: 'Vermont, the Beast of the East' },
  { id: 'MOUNTAIN_CREEK', label: 'Mountain Creek', emoji: '🎿', description: 'New Jersey, accessible fun' },
  { id: 'COPPER_MOUNTAIN', label: 'Copper Mountain', emoji: '🥉', description: 'Colorado, naturally divided terrain' },
  { id: 'BRECKENRIDGE', label: 'Breckenridge', emoji: '🏘️', description: 'Colorado, historic mountain town' },
  { id: 'KEYSTONE', label: 'Keystone', emoji: '🌙', description: 'Colorado, night skiing' },
];

/**
 * Type guard to check if a string is a valid LocationId
 */
export function isValidLocation(value: string): value is LocationId {
  return LOCATION_IDS.includes(value as LocationId);
}

/**
 * Get display label for a location ID
 */
export function getLocationLabel(locId: LocationId): string {
  const option = LOCATION_OPTIONS.find(l => l.id === locId);
  return option?.label || locId;
}

/**
 * Get location with emoji for display
 */
export function getLocationDisplay(locId: LocationId): string {
  const option = LOCATION_OPTIONS.find(l => l.id === locId);
  return option ? `${option.emoji} ${option.label}` : locId;
}
