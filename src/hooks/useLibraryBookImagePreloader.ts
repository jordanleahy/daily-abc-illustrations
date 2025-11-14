import { useEffect, useMemo } from 'react';
import { useBookPageImages } from './useBookPageImages';
import { useImagePreloader } from './useImagePreloader';
import { prefetchImagesToCache } from '@/utils/imageCaching';
import type { Page } from '@/types/book';

/**
 * Hook to preload and cache library book images for instant display
 * Uses page_image_urls table via useBookPageImages (RLS-safe)
 * Prioritizes first 3 visible pages for immediate display
 */
export function useLibraryBookImagePreloader(bookId: string | undefined, pages: Page[] | undefined) {
  const { data: imageMap = {} } = useBookPageImages(bookId);
  
  // Extract URLs in page order
  const imageUrls = useMemo(() => {
    if (!pages || !imageMap) return [];
    return pages
      .map(page => imageMap[page.page_number])
      .filter((url): url is string => !!url);
  }, [pages, imageMap]);
  
  // Split into priority (first 3) and remaining batches
  const priorityUrls = imageUrls.slice(0, 3);
  const remainingUrls = imageUrls.slice(3);
  
  // Preload priority images immediately
  useImagePreloader(priorityUrls, {
    priority: true,
    width: 1200,
    quality: 85,
    batchSize: 3,
    batchDelay: 0
  });
  
  // Preload remaining images with batching
  useImagePreloader(remainingUrls, {
    priority: false,
    width: 1200,
    quality: 85,
    batchSize: 6,
    batchDelay: 200
  });
  
  // Cache all images to service worker for instant repeat loads
  useEffect(() => {
    if (imageUrls.length > 0) {
      prefetchImagesToCache(imageUrls).catch(error => {
        console.warn('[Library Image Preloader] Service worker cache failed:', error);
      });
    }
  }, [imageUrls.length]);
}
