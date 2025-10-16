import { useEffect } from 'react';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';
import { optimizeImageUrl, generateBlurPlaceholder } from '@/utils/imageOptimization';
import { prefetchImagesToCache } from '@/utils/imageCaching';

/**
 * Hook to preload and cache library book images for instant display
 * Uses service worker caching for persistent storage (30 days)
 * Optimized to avoid duplicate loading and use blur placeholders
 */
export function useLibraryImagePreloader(books: DailyPublishedWithBook[] | undefined) {
  useEffect(() => {
    if (!books || books.length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];
    
    // Extract all image URLs
    const allImageUrls = books.map(book => book.og_image_url).filter(Boolean);
    
    // Prefetch all images to service worker cache immediately in background
    if (allImageUrls.length > 0) {
      prefetchImagesToCache(allImageUrls).catch(error => {
        console.error('[Library Image Preloader] Cache prefetch failed:', error);
      });
    }

    // Batch 1: First 6 book images immediately (critical - visible on load)
    // Load both blur placeholders and optimized images
    const batch1 = books.slice(0, 6);
    batch1.forEach((book) => {
      if (book.og_image_url) {
        // Preload tiny blur placeholder first (instant display)
        const blurImg = new Image();
        const blurUrl = generateBlurPlaceholder(book.og_image_url);
        if (blurUrl) {
          blurImg.src = blurUrl;
        }
        
        // Then preload optimized image
        const img = new Image();
        img.src = optimizeImageUrl(book.og_image_url, { width: 800, quality: 85 }) || book.og_image_url;
      }
    });

    // Batch 2: Next 6 images after 200ms (just below fold)
    if (books.length > 6) {
      timeouts.push(setTimeout(() => {
        const batch2 = books.slice(6, 12);
        batch2.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = optimizeImageUrl(book.og_image_url, { width: 800, quality: 85 }) || book.og_image_url;
          }
        });
      }, 200));
    }

    // Batch 3: Remaining images after 500ms (deferred, lower priority)
    if (books.length > 12) {
      timeouts.push(setTimeout(() => {
        const batch3 = books.slice(12);
        batch3.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = optimizeImageUrl(book.og_image_url, { width: 800, quality: 85 }) || book.og_image_url;
          }
        });
      }, 500));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [books]);
}
