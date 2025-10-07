import { useEffect } from 'react';
import { optimizeImageUrl } from '@/utils/imageOptimization';

interface PreloadBatch {
  urls: (string | null | undefined)[];
  delay: number;
  priority?: 'high' | 'low';
}

/**
 * Strategically preload landing page images in batches
 * Batch 1: Immediate - hero + first 2 popular books
 * Batch 2: 50ms - next 4 popular books
 * Batch 3: 200ms - library section
 */
export function useLandingImagePreloader(
  heroImages: (string | null | undefined)[],
  popularImages: (string | null | undefined)[],
  libraryImages: (string | null | undefined)[]
) {
  useEffect(() => {
    const batches: PreloadBatch[] = [
      {
        urls: [
          ...heroImages.slice(0, 1), // First hero image
          ...popularImages.slice(0, 2) // First 2 popular books
        ],
        delay: 0,
        priority: 'high'
      },
      {
        urls: popularImages.slice(2, 6), // Next 4 popular books
        delay: 50,
        priority: 'high'
      },
      {
        urls: libraryImages.slice(0, 6), // First 6 library images
        delay: 200,
        priority: 'low'
      }
    ];

    const timeouts: number[] = [];

    batches.forEach(batch => {
      const timeoutId = window.setTimeout(() => {
        batch.urls
          .filter(Boolean)
          .forEach(url => {
            if (!url) return;
            const img = new Image();
            img.fetchPriority = batch.priority || 'low';
            img.src = optimizeImageUrl(url, { width: 800 }) || url;
          });
      }, batch.delay);

      timeouts.push(timeoutId);
    });

    return () => {
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [heroImages, popularImages, libraryImages]);
}
