/**
 * Central ID Registry for Book Creation System
 * 
 * All IDs are prefixed with their type namespace to prevent collisions:
 * - SEASON_WINTER, SEASON_SPRING, etc.
 * - LOCATION_VAIL_RESORT, LOCATION_WHISTLER, etc.
 * - CITY_JERSEY_CITY, CITY_HOBOKEN, etc.
 * - GRADE_PRE_K, GRADE_K, etc.
 * - MANNER_eating-habits, MANNER_respect, etc.
 * - SETTING_home, SETTING_school, etc.
 * 
 * This prevents bugs where IDs from different domains match incorrectly
 * (e.g., "WINTER" matching as both season AND location).
 */

// ID Prefixes - single source of truth
export const ID_PREFIX = {
  SEASON: 'SEASON_',
  LOCATION: 'LOCATION_',
  CITY: 'CITY_',
  GRADE: 'GRADE_',
  ENVIRONMENT: 'ENV_',
  CLOTHING_BRAND: 'BRAND_',
  MANNER_TYPE: 'MANNER_',
  MANNER_SETTING: 'SETTING_',
  THEME: 'THEME_',
} as const;

export type IdPrefix = typeof ID_PREFIX[keyof typeof ID_PREFIX];

/**
 * Check if an ID has a specific prefix
 */
export function hasPrefix(id: string, prefix: IdPrefix): boolean {
  return id.startsWith(prefix);
}

/**
 * Add prefix to an ID if it doesn't already have one
 */
export function addPrefix(id: string, prefix: IdPrefix): string {
  if (id.startsWith(prefix)) return id;
  return `${prefix}${id}`;
}

/**
 * Remove prefix from an ID
 */
export function removePrefix(id: string, prefix: IdPrefix): string {
  if (id.startsWith(prefix)) {
    return id.slice(prefix.length);
  }
  return id;
}

/**
 * Detect what type of ID this is based on prefix
 */
export function getIdType(id: string): keyof typeof ID_PREFIX | 'UNKNOWN' {
  for (const [type, prefix] of Object.entries(ID_PREFIX)) {
    if (id.startsWith(prefix)) {
      return type as keyof typeof ID_PREFIX;
    }
  }
  return 'UNKNOWN';
}

/**
 * Type guards for each ID type
 */
export const isSeasonId = (id: string): boolean => hasPrefix(id, ID_PREFIX.SEASON) || id === 'skip-season';
export const isLocationId = (id: string): boolean => hasPrefix(id, ID_PREFIX.LOCATION) || id === 'skip-location';
export const isCityId = (id: string): boolean => hasPrefix(id, ID_PREFIX.CITY) || id === 'skip-city';
export const isGradeId = (id: string): boolean => hasPrefix(id, ID_PREFIX.GRADE);
export const isEnvironmentId = (id: string): boolean => hasPrefix(id, ID_PREFIX.ENVIRONMENT) || id === 'skip-environment';
export const isClothingBrandId = (id: string): boolean => hasPrefix(id, ID_PREFIX.CLOTHING_BRAND) || id === 'skip-clothing-brand';
export const isMannerTypeId = (id: string): boolean => hasPrefix(id, ID_PREFIX.MANNER_TYPE);
export const isMannerSettingId = (id: string): boolean => hasPrefix(id, ID_PREFIX.MANNER_SETTING) || id === 'skip-setting';

/**
 * Legacy ID support - maps old IDs to new prefixed IDs
 * Used during migration period
 */
export const LEGACY_ID_MAP: Record<string, string> = {
  // Seasons
  'WINTER': 'SEASON_WINTER',
  'SPRING': 'SEASON_SPRING',
  'SUMMER': 'SEASON_SUMMER',
  'FALL': 'SEASON_FALL',
  // Grades
  'PRE_K': 'GRADE_PRE_K',
  'K': 'GRADE_K',
  'GRADE_1': 'GRADE_GRADE_1',
  'GRADE_2': 'GRADE_GRADE_2',
  'GRADE_3': 'GRADE_GRADE_3',
  // Manner settings
  'home': 'SETTING_home',
  'school': 'SETTING_school',
  'both': 'SETTING_both',
};

/**
 * Normalize an ID - converts legacy IDs to prefixed format
 */
export function normalizeId(id: string): string {
  return LEGACY_ID_MAP[id] || id;
}
