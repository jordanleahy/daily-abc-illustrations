/**
 * Valid manner type identifiers for Manners book agent
 */
export type MannerTypeId = 
  | 'eating-habits'
  | 'greeting-others'
  | 'sharing'
  | 'saying-please-thank-you'
  | 'respecting-personal-space'
  | 'listening-skills'
  | 'taking-turns'
  | 'being-kind';

/**
 * Display labels for manner types
 */
export const MANNER_TYPE_LABELS: Record<MannerTypeId, string> = {
  'eating-habits': '🍽️ Eating Habits',
  'greeting-others': '👋 Greeting Others',
  'sharing': '🤝 Sharing',
  'saying-please-thank-you': '🙏 Saying Please & Thank You',
  'respecting-personal-space': '🧍 Respecting Personal Space',
  'listening-skills': '👂 Listening Skills',
  'taking-turns': '🔄 Taking Turns',
  'being-kind': '💗 Being Kind',
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
