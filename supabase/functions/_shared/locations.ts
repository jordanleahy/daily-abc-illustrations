// Location constants for book creation flow
// Locations are asked as an optional discovery question at the end

export const VALID_LOCATIONS = [
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

export type ValidLocation = typeof VALID_LOCATIONS[number];

export interface LocationOption {
  id: ValidLocation;
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
 * Type guard for valid location IDs
 */
export function isValidLocation(value: string): value is ValidLocation {
  return VALID_LOCATIONS.includes(value as ValidLocation);
}

/**
 * Get location label for display
 */
export function getLocationLabel(locId: ValidLocation): string {
  const option = LOCATION_OPTIONS.find(l => l.id === locId);
  return option?.label || locId;
}

/**
 * Get location with emoji for display
 */
export function getLocationDisplay(locId: ValidLocation): string {
  const option = LOCATION_OPTIONS.find(l => l.id === locId);
  return option ? `${option.emoji} ${option.label}` : locId;
}
