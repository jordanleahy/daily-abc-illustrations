import { useEffect } from 'react';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';
import { optimizeImageUrl, generateBlurPlaceholder } from '@/utils/imageOptimization';
import { prefetchImagesToCache } from '@/utils/imageCaching';
import { getConnectionQuality } from '@/utils/connectionAware';

/**
 * Hook to preload and cache library book images for instant display
 * Uses service worker caching for persistent storage (30 days)
 * Optimized to avoid duplicate loading and use blur placeholders
 * Adapts to network conditions for optimal performance
 */
export function useLibraryImagePreloader(books: DailyPublishedWithBook[] | undefined) {
  useEffect(() => {
    if (!books || books.length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];
    const connectionQuality = getConnectionQuality();
    
    // Extract all image URLs
    const allImageUrls = books.map(book => book.og_image_url).filter(Boolean);
    
    // Prefetch all images to service worker cache immediately in background
    if (allImageUrls.length > 0) {
      prefetchImagesToCache(allImageUrls).catch(error => {
        console.error('[Library Image Preloader] Cache prefetch failed:', error);
      });
    }

    // Adjust batch size based on connection quality
    const firstBatchSize = connectionQuality === 'high' ? 9 : connectionQuality === 'medium' ? 6 : 3;
    const secondBatchSize = connectionQuality === 'high' ? 12 : connectionQuality === 'medium' ? 9 : 6;
    
    // Batch 1: First N book images immediately (critical - visible on load)
    // Load both blur placeholders and optimized images
    const batch1 = books.slice(0, firstBatchSize);
    batch1.forEach((book) => {
      if (book.og_image_url) {
        // Preload tiny blur placeholder first (instant display)
        const blurImg = new Image();
        const blurUrl = generateBlurPlaceholder(book.og_image_url);
        if (blurUrl) {
          blurImg.src = blurUrl;
        }
        
        // Then preload optimized image with connection-aware quality
        const img = new Image();
        img.src = optimizeImageUrl(book.og_image_url, { 
          width: 800, 
          useConnectionAware: true 
        }) || book.og_image_url;
      }
    });

    // Batch 2: Next N images after delay (just below fold)
    if (books.length > firstBatchSize) {
      const delay = connectionQuality === 'high' ? 150 : connectionQuality === 'medium' ? 300 : 500;
      
      timeouts.push(setTimeout(() => {
        const batch2 = books.slice(firstBatchSize, secondBatchSize);
        batch2.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = optimizeImageUrl(book.og_image_url, { 
              width: 800, 
              useConnectionAware: true 
            }) || book.og_image_url;
          }
        });
      }, delay));
    }

    // Batch 3: Remaining images after longer delay (deferred, lower priority)
    if (books.length > secondBatchSize) {
      const delay = connectionQuality === 'high' ? 400 : connectionQuality === 'medium' ? 800 : 1500;
      
      timeouts.push(setTimeout(() => {
        const batch3 = books.slice(secondBatchSize);
        batch3.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = optimizeImageUrl(book.og_image_url, { 
              width: 800, 
              useConnectionAware: true 
            }) || book.og_image_url;
          }
        });
      }, delay));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [books]);
}
