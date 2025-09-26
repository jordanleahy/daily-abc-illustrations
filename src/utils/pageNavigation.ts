import { Page } from '@/types/book';

/**
 * Reorders pages array to start from a specific letter and create a circular reading order.
 * Example: If starting at 'H', the order becomes: H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,A,B,C,D,E,F,G
 * This allows natural navigation that stops at the letter before the starting letter.
 */
export function reorderPagesFromStartingLetter(pages: Page[], startingIndex: number): Page[] {
  if (!pages.length || startingIndex < 0 || startingIndex >= pages.length) {
    return pages;
  }
  
  // Create new array starting from the starting index and wrapping around
  const reorderedPages = [
    ...pages.slice(startingIndex), // From starting letter to Z
    ...pages.slice(0, startingIndex) // From A to letter before starting letter
  ];
  
  return reorderedPages;
}

/**
 * Finds the original index of a page in the original pages array
 */
export function findOriginalPageIndex(pages: Page[], pageId: string): number {
  return pages.findIndex(page => page.id === pageId);
}