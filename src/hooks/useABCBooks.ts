import { useBooksByType } from './useBooksByType';

// Map URL slugs to metadata.abcTheme or characterTheme values
const slugToTheme: Record<string, string> = {
  animals: 'animals',
  food: 'food',
  nature: 'nature',
  sports: 'sports',
  vehicles: 'vehicles',
  ocean: 'ocean',
  space: 'space',
  dinosaurs: 'dinosaurs',
  farm: 'farm',
  bugs: 'bugs',
};

// Display names for themes
const themeDisplayNames: Record<string, string> = {
  animals: 'Animals',
  food: 'Food',
  nature: 'Nature',
  sports: 'Sports',
  vehicles: 'Vehicles',
  ocean: 'Ocean',
  space: 'Space',
  dinosaurs: 'Dinosaurs',
  farm: 'Farm',
  bugs: 'Bugs',
};

export function getABCThemeDisplayName(slug: string): string {
  return themeDisplayNames[slug.toLowerCase()] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function isValidABCTheme(slug: string): boolean {
  return slug.toLowerCase() in slugToTheme;
}

interface UseABCBooksOptions {
  themeSlug?: string | undefined;
}

/**
 * Hook for fetching ABC books - now uses the generic useBooksByType
 */
export function useABCBooks({ themeSlug }: UseABCBooksOptions = {}) {
  return useBooksByType({ 
    bookType: 'abc', 
    themeSlug: themeSlug ? slugToTheme[themeSlug.toLowerCase()] : undefined 
  });
}
