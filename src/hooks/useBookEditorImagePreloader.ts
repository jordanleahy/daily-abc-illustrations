import { useEffect } from 'react';
import { optimizeImageUrl } from '@/utils/imageOptimization';
import { prefetchImagesToCache } from '@/utils/imageCaching';

/**
 * Hook to preload and cache book editor page images for instant display
 * Uses service worker caching for persistent storage (30 days)
 * Implements progressive loading strategy for optimal performance
 */
export function useBookEditorImagePreloader(pageImages: Record<number, string> | undefined) {
  useEffect(() => {
    if (!pageImages || Object.keys(pageImages).length === 0) return;

    const timeouts: NodeJS.Timeout[] = [];
    
    // Extract all image URLs sorted by page number
    const sortedPageNumbers = Object.keys(pageImages)
      .map(Number)
      .sort((a, b) => a - b);
    
    const allImageUrls = sortedPageNumbers.map(pageNum => pageImages[pageNum]).filter(Boolean);
    
    // Prefetch all images to service worker cache immediately in background
    if (allImageUrls.length > 0) {
      prefetchImagesToCache(allImageUrls).catch(error => {
        console.error('[Book Editor Image Preloader] Cache prefetch failed:', error);
      });
    }

    // Batch 1: First 3 page images immediately (critical - cover + first 2 pages)
    const batch1Count = Math.min(3, allImageUrls.length);
    for (let i = 0; i < batch1Count; i++) {
      const imageUrl = allImageUrls[i];
      if (imageUrl) {
        const img = new Image();
        img.src = optimizeImageUrl(imageUrl, { width: 1024, quality: 85 }) || imageUrl;
      }
    }

    // Batch 2: Next 5 images after 150ms
    if (allImageUrls.length > 3) {
      timeouts.push(setTimeout(() => {
        const batch2End = Math.min(8, allImageUrls.length);
        for (let i = 3; i < batch2End; i++) {
          const imageUrl = allImageUrls[i];
          if (imageUrl) {
            const img = new Image();
            img.src = optimizeImageUrl(imageUrl, { width: 1024, quality: 85 }) || imageUrl;
          }
        }
      }, 150));
    }

    // Batch 3: Remaining images after 400ms
    if (allImageUrls.length > 8) {
      timeouts.push(setTimeout(() => {
        for (let i = 8; i < allImageUrls.length; i++) {
          const imageUrl = allImageUrls[i];
          if (imageUrl) {
            const img = new Image();
            img.src = optimizeImageUrl(imageUrl, { width: 1024, quality: 85 }) || imageUrl;
          }
        }
      }, 400));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [pageImages]);
}
