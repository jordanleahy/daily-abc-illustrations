import { useImagePreloader } from './useImagePreloader';

/**
 * Hook to preload and cache book editor page images for instant display
 * Uses unified image preloader with service worker caching and prioritized loading
 */
export function useBookEditorImagePreloader(pageImages: Record<number, string> | undefined) {
  // Extract sorted image URLs
  const imageUrls = pageImages 
    ? Object.keys(pageImages)
        .map(Number)
        .sort((a, b) => a - b)
        .map(pageNum => pageImages[pageNum])
        .filter(Boolean)
    : [];
  
  // Split into priority (first 3 visible) and remaining pages
  const priorityUrls = imageUrls.slice(0, 3);
  const remainingUrls = imageUrls.slice(3);
  
  // Preload priority images immediately with high priority
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
    batchSize: 5,
    batchDelay: 150
  });
}
