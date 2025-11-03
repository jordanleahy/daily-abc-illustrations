import { useImagePreloader } from './useImagePreloader';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

/**
 * Hook to preload and cache library book images for instant display
 * Uses unified image preloader with service worker caching
 */
export function useLibraryImagePreloader(books: DailyPublishedWithBook[] | undefined) {
  const imageUrls = books?.map(book => book.og_image_url).filter(Boolean) || [];
  
  useImagePreloader(imageUrls, {
    priority: false,
    width: 800,
    quality: 85,
    batchSize: 6,
    batchDelay: 150
  });
}
