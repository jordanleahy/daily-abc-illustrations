/**
 * Character Theme Enum
 * Standardized character/style themes for books
 * All values are kebab-case for database consistency
 */
export const CharacterTheme = {
  PAW_PATROL: 'paw-patrol',
  FROZEN: 'frozen',
  PEPPA_PIG: 'peppa-pig',
  BLUEY: 'bluey',
  COCOMELON: 'cocomelon',
  MOANA: 'moana',
  MICKEY_MOUSE: 'mickey-mouse',
  MARIO: 'mario',
  SESAME_STREET: 'sesame-street',
  BENJI_DAVIES: 'benji-davies',
  BLACK_AND_WHITE: 'black-and-white',
  BEAR_STORIES: 'bear-stories',
  CUSTOM: 'custom',
  NO_THEME: 'no-theme',
} as const;

export type CharacterThemeValue = typeof CharacterTheme[keyof typeof CharacterTheme];

/**
 * Display names for character themes
 * Maps kebab-case values to user-friendly display names
 */
export const themeDisplayNames: Record<CharacterThemeValue, string> = {
  'paw-patrol': 'PAW Patrol',
  'frozen': 'Frozen',
  'peppa-pig': 'Peppa Pig',
  'bluey': 'Bluey',
  'cocomelon': 'Cocomelon',
  'moana': 'Moana',
  'mickey-mouse': 'Mickey Mouse',
  'mario': 'Mario',
  'sesame-street': 'Sesame Street',
  'benji-davies': 'Benji Davies Style',
  'black-and-white': 'Black & White',
  'bear-stories': 'Bear Stories',
  'custom': 'Custom Theme',
  'no-theme': 'Classic Educational',
};

/**
 * Helper to check if a string is a valid character theme
 */
export const isValidCharacterTheme = (value: string): value is CharacterThemeValue => {
  return Object.values(CharacterTheme).includes(value as CharacterThemeValue);
};

/**
 * Get display name for a theme value
 */
export const getThemeDisplayName = (theme: string): string => {
  if (isValidCharacterTheme(theme)) {
    return themeDisplayNames[theme];
  }
  // Fallback for unknown themes
  return theme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
