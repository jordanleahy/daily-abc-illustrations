import { useImagePreloader } from './useImagePreloader';

/**
 * Hook to preload and cache book editor page images for instant display
 * Uses unified image preloader with service worker caching
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
  
  useImagePreloader(imageUrls, {
    priority: false,
    width: 1024,
    quality: 85,
    batchSize: 5,
    batchDelay: 150
  });
}
