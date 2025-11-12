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
    thumbnail: '/placeholder.svg',
    altText: 'Daniel Tiger themed book'
  },
  'frozen': {
    thumbnail: '/themes/frozen.png',
    altText: 'Frozen themed book'
  },
  'cocomelon': {
    thumbnail: '/themes/cocomelon.png',
    altText: 'Cocomelon themed book'
  },
  'moana': {
    thumbnail: '/themes/moana.png',
    altText: 'Moana themed book'
  },
  'mickey-mouse': {
    thumbnail: '/themes/mickey-mouse.png',
    altText: 'Mickey Mouse themed book'
  },
  'toy-story': {
    thumbnail: '/themes/toy-story.png',
    altText: 'Toy Story themed book'
  },
  'pokemon': {
    thumbnail: '/themes/pokemon.png',
    altText: 'Pokemon themed book'
  },
  'mario': {
    thumbnail: '/themes/mario.png',
    altText: 'Mario themed book'
  },
  'sesame-street': {
    thumbnail: '/themes/sesame-street.png',
    altText: 'Sesame Street themed book'
  },
  'benji-davies': {
    thumbnail: '/themes/benji-davies.png',
    altText: 'Benji Davies style - Grandad\'s Island inspired watercolor illustrations'
  },
  'black-and-white': {
    thumbnail: '/themes/black-and-white.png',
    altText: 'Black and white classic illustration style'
  },
  'bear-stories': {
    thumbnail: '/themes/bear-stories.png',
    altText: 'Bear Memories - A cinematic winter adventure at Snowtop Mountain'
  }
};

