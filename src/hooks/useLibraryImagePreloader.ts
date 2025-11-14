import { useImagePreloader } from './useImagePreloader';
import type { LibraryBook } from '@/types/library';

/**
 * Hook to preload and cache library book images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 6 images for immediate display
 */
export function useLibraryImagePreloader(books: LibraryBook[] | undefined) {
  const imageUrls = books?.map(book => book.cover_image || book.thumbnail_url).filter(Boolean) || [];
  
  // Split into priority (first 6) and remaining batches
  const priorityUrls = imageUrls.slice(0, 6);
  const remainingUrls = imageUrls.slice(6);
  
  // Preload priority images immediately
  useImagePreloader(priorityUrls, {
    priority: true,
    width: 800,
    quality: 85,
    batchSize: 6,
    batchDelay: 0
  });
  
  // Preload remaining images with batching
  useImagePreloader(remainingUrls, {
    priority: false,
    width: 800,
    quality: 85,
    batchSize: 6,
    batchDelay: 200
  });
}
