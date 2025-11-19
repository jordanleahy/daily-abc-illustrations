import { Book } from '@/types/book';
import { LibraryBook } from '@/types/library';
import { themeDisplayNames, isValidCharacterTheme, getThemeDisplayName, CharacterThemeValue } from '@/types/characterTheme';

export interface ThemeOption {
  value: string;
  label: string;
}

/**
 * Normalizes theme name for display
 * Uses standardized display names from characterTheme enum
 * Examples: "paw-patrol" → "PAW Patrol", "bear-stories" → "Bear Stories"
 */
export const normalizeThemeName = (theme: string): string => {
  if (!theme) return '';
  return getThemeDisplayName(theme);
};

/**
 * Returns all available themes from the CharacterTheme enum
 * This ensures the filter always shows standardized themes
 */
export const extractAvailableThemes = (books: (Book | LibraryBook)[]): ThemeOption[] => {
  // Convert themeDisplayNames to ThemeOption array and sort by label
  return Object.entries(themeDisplayNames)
    .map(([value, label]) => ({
      value,
      label
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Filters books by search query and selected themes
 * @param books - Array of books to filter
 * @param searchQuery - Search query for book title (case-insensitive)
 * @param selectedThemes - Array of theme values to filter by (OR logic)
 * @returns Filtered array of books
 */
export const filterBooksByThemeAndSearch = <T extends Book | LibraryBook>(
  books: T[],
  searchQuery: string,
  selectedThemes: string[]
): T[] => {
  return books.filter(book => {
    // Search filter: match book title
    const matchesSearch = !searchQuery || 
      book.book_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Theme filter: match any selected theme (OR logic)
    const bookTheme = book.metadata?.characterTheme;
    const matchesTheme = selectedThemes.length === 0 || 
      (bookTheme && selectedThemes.includes(bookTheme as string));
    
    return matchesSearch && matchesTheme;
  });
};
