import { Page } from '@/types/book';

/**
 * Determines the starting letter index based on publication date
 * Uses a deterministic approach so the same date always produces the same starting letter
 */
export function getStartingLetterIndex(publicationDate: string): number {
  const date = new Date(publicationDate);
  // Use day of year to get consistent starting letter for each publication
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dayOfYear % 26; // 0-25 for A-Z
}

/**
 * Reorders pages array to start from a specific letter and cycle through the alphabet
 * Example: if startingIndex = 3 (D), returns [D, E, F, ..., Z, A, B, C]
 */
export function reorderPagesFromStartingLetter(pages: Page[], startingLetterIndex: number): Page[] {
  if (pages.length === 0 || startingLetterIndex < 0 || startingLetterIndex >= pages.length) {
    return pages;
  }

  // Sort pages by letter to ensure consistent A-Z order first
  const sortedPages = [...pages].sort((a, b) => a.letter.localeCompare(b.letter));
  
  // Reorder to start from the specified letter index
  const reorderedPages = [
    ...sortedPages.slice(startingLetterIndex),
    ...sortedPages.slice(0, startingLetterIndex)
  ];

  return reorderedPages;
}

/**
 * Gets the starting letter for a daily publication based on its publication date
 */
export function getStartingLetterForPublication(publicationDate: string): string {
  const index = getStartingLetterIndex(publicationDate);
  return String.fromCharCode(65 + index); // Convert 0-25 to A-Z
}