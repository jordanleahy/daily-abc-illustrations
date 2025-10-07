import { useEffect } from 'react';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';
import { optimizeImageUrl } from '@/utils/imageOptimization';
import { prefetchImagesToCache } from '@/utils/imageCaching';

/**
 * Hook to preload and cache library book images for instant display
 * Uses service worker caching for persistent storage (30 days)
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
    const batch1 = books.slice(0, 6);
    batch1.forEach((book) => {
      if (book.og_image_url) {
        const img = new Image();
        img.src = optimizeImageUrl(book.og_image_url, { width: 800, quality: 85 }) || book.og_image_url;
      }
    });

    // Batch 2: Next 6 images after 150ms
    if (books.length > 6) {
      timeouts.push(setTimeout(() => {
        const batch2 = books.slice(6, 12);
        batch2.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = optimizeImageUrl(book.og_image_url, { width: 800, quality: 85 }) || book.og_image_url;
          }
        });
      }, 150));
    }

    // Batch 3: Remaining images after 400ms
    if (books.length > 12) {
      timeouts.push(setTimeout(() => {
        const batch3 = books.slice(12);
        batch3.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = optimizeImageUrl(book.og_image_url, { width: 800, quality: 85 }) || book.og_image_url;
          }
        });
      }, 400));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [books]);
}
