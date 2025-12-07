import { useTypedImagePreloader } from './useTypedImagePreloader';
import type { LibraryBook } from '@/types/library';

/**
 * Hook to preload and cache home page book images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 3 visible books for immediate display
 */
export function useHomeImagePreloader(books: LibraryBook[] | undefined) {
  useTypedImagePreloader(
    books,
    book => book.cover_image,
    { priorityCount: 3, width: 800, batchSize: 6, batchDelay: 200 }
  );
}
