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
  },
  'cocomelon': {
    thumbnail: '/placeholder.svg',
    altText: 'Cocomelon themed book'
  },
  'moana': {
    thumbnail: '/placeholder.svg',
    altText: 'Moana themed book'
  },
  'mickey-mouse': {
    thumbnail: '/placeholder.svg',
    altText: 'Mickey Mouse themed book'
  },
  'spider-man': {
    thumbnail: '/placeholder.svg',
    altText: 'Spider-Man themed book'
  },
  'toy-story': {
    thumbnail: '/placeholder.svg',
    altText: 'Toy Story themed book'
  },
  'sonic': {
    thumbnail: '/placeholder.svg',
    altText: 'Sonic themed book'
  },
  'pokemon': {
    thumbnail: '/placeholder.svg',
    altText: 'Pokemon themed book'
  },
  'mario': {
    thumbnail: '/placeholder.svg',
    altText: 'Mario themed book'
  }
};

