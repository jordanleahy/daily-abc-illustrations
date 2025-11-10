/**
 * ⚠️ CRITICAL HOOK - DO NOT CREATE DUPLICATE PRELOADING LOGIC
 * 
 * Unified image preloader for consistent caching across the app.
 * Uses service worker for instant repeat loads (cache hit rate >80%).
 * 
 * When adding new image features:
 * 1. Create a specialized hook that wraps this one (see use*ImagePreloader.ts files)
 * 2. DO NOT create custom preloading logic
 * 3. Follow the pattern in existing specialized hooks
 * 
 * See: docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md
 */

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
    
    // ⚡ OPTIMIZED: Only use service worker cache, avoid Image object creation
    // Browser will handle preloading via link rel=preload tags in OptimizedImage component
    prefetchImagesToCache(validUrls).catch(error => {
      console.error('[Image Preloader] Cache prefetch failed:', error);
    });

    // For priority images only, use native browser preload hints (more efficient)
    if (priority) {
      const links: HTMLLinkElement[] = [];
      validUrls.slice(0, 6).forEach(url => { // Limit to first 6 priority images
        const optimizedUrl = optimizeImageUrl(url, { width, quality });
        if (optimizedUrl) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = optimizedUrl;
          document.head.appendChild(link);
          links.push(link);
        }
      });
      
      return () => {
        links.forEach(link => link.remove());
      };
    }
  }, [imageUrls, priority, width, quality]);
}

