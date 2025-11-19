/**
 * Character Theme Enum
 * Standardized character/style themes for books
 * All values are kebab-case for database consistency
 */
export const CharacterTheme = {
  PAW_PATROL: 'paw-patrol',
  PEPPA_PIG: 'peppa-pig',
  BLUEY: 'bluey',
  DANIEL_TIGER: 'daniel-tiger',
  FROZEN: 'frozen',
  COCOMELON: 'cocomelon',
  MOANA: 'moana',
  MICKEY_MOUSE: 'mickey-mouse',
  TOY_STORY: 'toy-story',
  POKEMON: 'pokemon',
  MARIO: 'mario',
  SESAME_STREET: 'sesame-street',
  BENJI_DAVIES: 'benji-davies',
  BLACK_AND_WHITE: 'black-and-white',
  BEAR_STORIES: 'bear-stories',
  JEWISH_HOLIDAYS: 'jewish-holidays',
  DORA: 'dora',
  LION_KING: 'lion-king',
} as const;

export type CharacterThemeValue = typeof CharacterTheme[keyof typeof CharacterTheme];

/**
 * Display names for character themes
 * Maps kebab-case values to user-friendly display names
 */
export const themeDisplayNames: Record<CharacterThemeValue, string> = {
  'paw-patrol': 'PAW Patrol',
  'peppa-pig': 'Peppa Pig',
  'bluey': 'Bluey',
  'daniel-tiger': 'Daniel Tiger',
  'frozen': 'Frozen',
  'cocomelon': 'Cocomelon',
  'moana': 'Moana',
  'mickey-mouse': 'Mickey Mouse',
  'toy-story': 'Toy Story',
  'pokemon': 'Pokemon',
  'mario': 'Mario',
  'sesame-street': 'Sesame Street',
  'benji-davies': 'Benji Davies Style',
  'black-and-white': 'Black & White',
  'bear-stories': 'Bear Stories',
  'jewish-holidays': 'Jewish Holidays & Traditions',
  'dora': 'Dora the Explorer',
  'lion-king': 'The Lion King',
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
