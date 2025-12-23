/**
 * Preloads book cover images for the chat empty state
 * Ensures instant display when users open the chat creation interface
 */
import { useMemo } from 'react';
import { useImagePreloader } from './useImagePreloader';

// Import all book cover images
import abcBookCover from '@/assets/book-covers/abc-cover.png';
import numbersBookCover from '@/assets/book-covers/numbers-cover.png';
import colorsBookCover from '@/assets/book-covers/colors-cover.png';
import shapesBookCover from '@/assets/book-covers/shapes-cover.png';
import emotionsBookCover from '@/assets/book-covers/emotions-cover.png';
import oppositesBookCover from '@/assets/book-covers/opposites-cover.png';
import rhymingBookCover from '@/assets/book-covers/rhyming-cover.png';
import sightWordsBookCover from '@/assets/book-covers/sight-words-cover.png';
import animalsBookCover from '@/assets/book-covers/animals-cover.png';
import digraphsBookCover from '@/assets/book-covers/digraphs-cover.jpeg';
import bedtimeBookCover from '@/assets/book-covers/bedtime-cover.png';
import cvcBookCover from '@/assets/book-covers/cvc-cover.png';
import firstWordsBookCover from '@/assets/book-covers/first-words-cover.png';
import generalBookCover from '@/assets/book-covers/general-cover.png';
import parentEducationBookCover from '@/assets/book-covers/parent-education-cover.png';

export function useChatBookCoversPreloader() {
  // Ordered by database sort_order to ensure first 6 get <link rel="preload"> hints
  const bookCoverUrls = useMemo(() => [
    digraphsBookCover,        // sort_order: -1 (displays FIRST)
    abcBookCover,             // sort_order: 0
    rhymingBookCover,         // sort_order: 1
    numbersBookCover,         // sort_order: 2
    shapesBookCover,          // sort_order: 3
    colorsBookCover,          // sort_order: 4
    // Below the fold - less critical for instant loading:
    oppositesBookCover,       // sort_order: 5
    emotionsBookCover,        // sort_order: 6
    animalsBookCover,         // sort_order: 7
    firstWordsBookCover,      // sort_order: 8
    bedtimeBookCover,         // sort_order: 9
    cvcBookCover,             // sort_order: 10
    sightWordsBookCover,      // sort_order: 11
    generalBookCover,         // sort_order: 13
    parentEducationBookCover, // sort_order: 14
  ], []);

  // Preload all book covers with high priority for instant display
  useImagePreloader(bookCoverUrls, {
    priority: true,
    width: 400, // Smaller size for thumbnails
    quality: 90,
  });
}
