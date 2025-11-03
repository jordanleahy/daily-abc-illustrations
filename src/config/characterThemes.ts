export interface CharacterTheme {
  thumbnail: string;
  altText: string;
}

export const characterThemes: Record<string, CharacterTheme> = {
  'paw-patrol': {
    thumbnail: '/themes/paw-patrol.png',
    altText: 'Paw Patrol themed book'
  },
  'peppa-pig': {
    thumbnail: '/themes/peppa-pig.png',
    altText: 'Peppa Pig themed book'
  },
  'bluey': {
    thumbnail: '/placeholder.svg',
    altText: 'Bluey themed book'
  },
  'daniel-tiger': {
    thumbnail: '/placeholder.svg',
    altText: 'Daniel Tiger themed book'
  },
  'frozen': {
    thumbnail: '/placeholder.svg',
    altText: 'Frozen themed book'
  }
};

export const getThemeByLabel = (label: string): CharacterTheme | undefined => {
  // Remove all emojis (comprehensive Unicode ranges), punctuation, and filler words
  const cleanedLabel = label
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[^\w\s-]/g, '') // Remove punctuation
    .replace(/\b(themed|book|the|a|an)\b/gi, '') // Remove filler words
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  
  // Try exact match first
  if (characterThemes[cleanedLabel]) {
    return characterThemes[cleanedLabel];
  }
  
  // Try substring matching (label contains theme key or vice versa)
  for (const [key, theme] of Object.entries(characterThemes)) {
    if (cleanedLabel.includes(key) || key.includes(cleanedLabel)) {
      return theme;
    }
  }
  
  return undefined;
};
