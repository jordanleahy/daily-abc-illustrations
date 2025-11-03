import { useEffect } from 'react';
import { optimizeImageUrl } from '@/utils/imageOptimization';
import { prefetchImagesToCache } from '@/utils/imageCaching';

interface PreloadOptions {
  priority?: boolean;
  width?: number;
  quality?: number;
  batchSize?: number;
  batchDelay?: number;
}

/**
 * Unified image preloader hook for consistent image loading across the app
 * Handles service worker caching and progressive batch loading
 */
export function useImagePreloader(
  imageUrls: (string | undefined)[],
  options: PreloadOptions = {}
) {
  const {
    priority = false,
    width = 800,
    quality = 85,
    batchSize = 5,
    batchDelay = 150
  } = options;

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;

    const validUrls = imageUrls.filter((url): url is string => !!url);
    
    // Prefetch to service worker cache in background
    prefetchImagesToCache(validUrls).catch(error => {
      console.error('[Image Preloader] Cache prefetch failed:', error);
    });

    // If priority, load all immediately
    if (priority) {
      validUrls.forEach(url => {
        const img = new Image();
        img.src = optimizeImageUrl(url, { width, quality }) || url;
      });
      return;
    }

    // Otherwise, batch load with delays
    const timeouts: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize);
      const delay = (i / batchSize) * batchDelay;
      
      timeouts.push(setTimeout(() => {
        batch.forEach(url => {
          const img = new Image();
          img.src = optimizeImageUrl(url, { width, quality }) || url;
        });
      }, delay));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [imageUrls, priority, width, quality, batchSize, batchDelay]);
}

