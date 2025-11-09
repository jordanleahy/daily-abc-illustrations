import { useImagePreloader } from './useImagePreloader';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

/**
 * Hook to preload and cache home page book images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 3 visible books for immediate display
 */
export function useHomeImagePreloader(books: DailyPublishedWithBook[] | undefined) {
  const imageUrls = books?.map(book => book.og_image_url).filter(Boolean) || [];
  
  // Split into priority (first 3 visible in carousel) and remaining batches
  const priorityUrls = imageUrls.slice(0, 3);
  const remainingUrls = imageUrls.slice(3);
  
  // Preload priority images immediately
  useImagePreloader(priorityUrls, {
    priority: true,
    width: 800,
    quality: 85,
    batchSize: 3,
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
