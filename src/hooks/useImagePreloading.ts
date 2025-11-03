import { useImagePreloader } from './useImagePreloader';

interface Book {
  id: string;
  firstPageImageUrl?: string;
}

/**
 * Hook to preload library book thumbnail images
 * Uses unified image preloader with service worker caching
 */
export function useImagePreloading(books: Book[] | undefined) {
  const imageUrls = books?.map(b => b.firstPageImageUrl).filter(Boolean) || [];
  
  useImagePreloader(imageUrls, {
    priority: false,
    width: 600,
    quality: 85,
    batchSize: 4,
    batchDelay: 250
  });
}
