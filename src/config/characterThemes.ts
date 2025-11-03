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
    thumbnail: '/themes/bluey.png',
    altText: 'Bluey themed book'
  },
  'daniel-tiger': {
    thumbnail: '/themes/daniel-tiger.png',
    altText: 'Daniel Tiger themed book'
  }
};

export const getThemeByLabel = (label: string): CharacterTheme | undefined => {
  const normalizedLabel = label.toLowerCase().replace(/\s+/g, '-');
  return characterThemes[normalizedLabel];
};
