/**
 * Valid manner type identifiers for Manners book agent
 * Aligned with agent instructions v1.5.0
 */
export type MannerTypeId = 
  | 'eating-habits'
  | 'social-skills'
  | 'sharing'
  | 'respect'
  | 'hygiene';

/**
 * Display labels for manner types
 * Must match the [SUGGEST] block in the Manners agent instructions
 */
export const MANNER_TYPE_LABELS: Record<MannerTypeId, string> = {
  'eating-habits': '🍽️ Table Manners & Eating Habits',
  'social-skills': '🤝 Social Skills & Politeness',
  'sharing': '🎁 Sharing & Taking Turns',
  'respect': '🙏 Respect & Kindness',
  'hygiene': '🧼 Hygiene & Self-Care',
};

/**
 * Check if a string is a valid manner type
 */
export function isValidMannerType(value: string): value is MannerTypeId {
  return value in MANNER_TYPE_LABELS;
}

/**
 * Get display label for a manner type
 */
export function getMannerTypeLabel(mannerType: MannerTypeId): string {
  return MANNER_TYPE_LABELS[mannerType] || mannerType;
}
