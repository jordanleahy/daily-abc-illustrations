import { useTypedImagePreloader } from './useTypedImagePreloader';
import type { LibraryBook } from '@/types/library';

/**
 * Hook to preload and cache library book images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 6 images for immediate display
 */
export function useLibraryImagePreloader(books: LibraryBook[] | undefined) {
  useTypedImagePreloader(
    books,
    book => book.cover_image,
    { priorityCount: 6, width: 800, batchSize: 6, batchDelay: 200 }
  );
}
