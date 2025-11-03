export interface CharacterTheme {
  id: string;
  thumbnail?: string; // Path to image once user adds it
  altText: string; // For accessibility
}

export const CHARACTER_THEMES: Record<string, CharacterTheme> = {
  'paw-patrol': { id: 'paw-patrol', altText: 'Paw Patrol' },
  'frozen': { id: 'frozen', altText: 'Frozen' },
  'peppa-pig': { id: 'peppa-pig', altText: 'Peppa Pig' },
  'bluey': { id: 'bluey', altText: 'Bluey' },
  'cocomelon': { id: 'cocomelon', altText: 'Cocomelon' },
  'moana': { id: 'moana', altText: 'Moana' },
  'mickey-mouse': { id: 'mickey-mouse', altText: 'Mickey Mouse' },
  'spider-man': { id: 'spider-man', altText: 'Spider-Man' },
  'toy-story': { id: 'toy-story', altText: 'Toy Story' },
  'sonic': { id: 'sonic', altText: 'Sonic' },
  'pokemon': { id: 'pokemon', altText: 'Pokémon' },
  'mario': { id: 'mario', altText: 'Mario' },
  'skip': { id: 'skip', altText: 'No theme' }
};
