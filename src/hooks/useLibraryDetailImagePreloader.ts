import { useEffect } from 'react';
import { useBookPageImages } from './useBookPageImages';
import { useImagePreloader } from './useImagePreloader';
import { prefetchImagesToCache } from '@/utils/imageCaching';

/**
 * Progressive image preloader for library detail page
 * Phase 1: Load first 3 pages immediately (visible above fold)
 * Phase 2: Load next 9 pages (visible on scroll)
 * Phase 3: Load remaining pages in background
 */
export function useLibraryDetailImagePreloader(bookId: string | undefined) {
  const { data: pageImages, isLoading } = useBookPageImages(bookId);
  
  // Convert to sorted array of URLs
  const imageUrls = pageImages 
    ? Object.keys(pageImages)
        .map(Number)
        .sort((a, b) => a - b)
        .map(pageNum => pageImages[pageNum])
        .filter(Boolean)
    : [];
  
  // Phase 1: Priority (first 3 pages - always visible)
  const priorityUrls = imageUrls.slice(0, 3);
  
  // Phase 2: Secondary (next 9 pages - scroll area)
  const secondaryUrls = imageUrls.slice(3, 12);
  
  // Phase 3: Remaining (rest of book)
  const remainingUrls = imageUrls.slice(12);
  
  // Preload priority images immediately with highest priority
  useImagePreloader(priorityUrls, {
    priority: true,
    width: 800,
    quality: 85,
    batchSize: 3,
    batchDelay: 0
  });
  
  // Preload secondary images with slight delay
  useImagePreloader(secondaryUrls, {
    priority: false,
    width: 800,
    quality: 85,
    batchSize: 3,
    batchDelay: 100
  });
  
  // Preload remaining images in background
  useImagePreloader(remainingUrls, {
    priority: false,
    width: 800,
    quality: 85,
    batchSize: 5,
    batchDelay: 300
  });
  
  // Cache all images to service worker for instant repeat loads
  useEffect(() => {
    if (imageUrls.length > 0) {
      prefetchImagesToCache(imageUrls).catch(error => {
        console.warn('[Detail Image Preloader] Service worker cache failed:', error);
      });
    }
  }, [imageUrls.length]);
  
  return {
    pageImages,
    isLoading,
    priorityCount: priorityUrls.length,
    totalCount: imageUrls.length
  };
}
