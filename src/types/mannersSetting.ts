/**
 * Manners Setting Type System for Manners Book Creation
 * Defines where the manners scenarios take place (home, school, both)
 * Aligned with Agent Instructions v1.5.0
 */

// Manners Setting IDs matching backend constants
export const MANNERS_SETTING_IDS = ['home', 'school', 'both'] as const;

export type MannersSettingId = typeof MANNERS_SETTING_IDS[number];

export interface MannersSettingOption {
  id: MannersSettingId;
  label: string;
  emoji: string;
  description: string;
}

// Static manners setting options
export const MANNERS_SETTING_OPTIONS: MannersSettingOption[] = [
  { id: 'home', label: 'Home', emoji: '🏠', description: 'Manners at home with family' },
  { id: 'school', label: 'School', emoji: '🏫', description: 'Manners at school with teachers and classmates' },
  { id: 'both', label: 'Both Home & School', emoji: '🏠🏫', description: 'Manners in both settings' },
];

/**
 * Type guard to check if a string is a valid MannersSettingId
 */
export function isValidMannersSetting(value: string): value is MannersSettingId {
  return MANNERS_SETTING_IDS.includes(value as MannersSettingId);
}

/**
 * Get display label for a manners setting ID
 */
export function getMannersSettingLabel(settingId: MannersSettingId): string {
  const option = MANNERS_SETTING_OPTIONS.find(s => s.id === settingId);
  return option?.label || settingId;
}

/**
 * Get manners setting with emoji for display
 */
export function getMannersSettingDisplay(settingId: MannersSettingId): string {
  const option = MANNERS_SETTING_OPTIONS.find(s => s.id === settingId);
  return option ? `${option.emoji} ${option.label}` : settingId;
}
