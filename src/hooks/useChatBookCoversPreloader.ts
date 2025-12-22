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
  // All book cover URLs in a stable array
  const bookCoverUrls = useMemo(() => [
    abcBookCover,
    numbersBookCover,
    colorsBookCover,
    shapesBookCover,
    emotionsBookCover,
    oppositesBookCover,
    rhymingBookCover,
    sightWordsBookCover,
    animalsBookCover,
    digraphsBookCover,
    bedtimeBookCover,
    cvcBookCover,
    firstWordsBookCover,
    generalBookCover,
    parentEducationBookCover,
  ], []);

  // Preload all book covers with high priority for instant display
  useImagePreloader(bookCoverUrls, {
    priority: true,
    width: 400, // Smaller size for thumbnails
    quality: 90,
  });
}
