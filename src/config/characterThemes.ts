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

