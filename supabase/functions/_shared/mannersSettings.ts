/**
 * Manners Setting definitions for Edge Functions
 * Defines where manners scenarios take place (home, school, both)
 * Aligned with Agent Instructions v1.5.0 and src/types/mannersSetting.ts
 */

// Valid manners setting IDs
export const MANNERS_SETTING_IDS = ['home', 'school', 'both'] as const;

export type ValidMannersSetting = typeof MANNERS_SETTING_IDS[number];

// Display labels with emojis
export const MANNERS_SETTING_LABELS: Record<ValidMannersSetting, string> = {
  'home': '🏠 Home',
  'school': '🏫 School',
  'both': '🏠🏫 Both Home & School',
};

/**
 * Check if a value is a valid manners setting ID
 */
export function isValidMannersSetting(value: string | null | undefined): value is ValidMannersSetting {
  if (!value) return false;
  return MANNERS_SETTING_IDS.includes(value as ValidMannersSetting);
}

/**
 * Get display label for a manners setting
 */
export function getMannersSettingDisplay(setting: ValidMannersSetting): string {
  return MANNERS_SETTING_LABELS[setting] || setting;
}

/**
 * Get manners setting suggest block for agent prompts
 */
export function getMannersSettingSuggestBlock(): string {
  return MANNERS_SETTING_IDS.map(id => `${id}: ${MANNERS_SETTING_LABELS[id]}`).join('\n') + '\nskip-setting: ⏭️ Skip';
}
