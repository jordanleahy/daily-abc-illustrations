import { useImagePreloader } from './useImagePreloader';

/**
 * Hook to preload and cache editor book thumbnail images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 6 images for immediate display
 */
export function useEditorImagePreloader(books: any[] | undefined) {
  // Extract image URLs from books (thumbnail_url or firstPageImageUrl)
  const imageUrls = books?.map(book => 
    book.thumbnail_url || book.firstPageImageUrl
  ).filter(Boolean) || [];
  
  // Split into priority (first 6) and remaining batches
  const priorityUrls = imageUrls.slice(0, 6);
  const remainingUrls = imageUrls.slice(6);
  
  // Preload priority images immediately
  useImagePreloader(priorityUrls, {
    priority: true,
    width: 800,
    quality: 85,
    batchSize: 6,
    batchDelay: 0
  });
  
  // Preload remaining images with batching
  useImagePreloader(remainingUrls, {
    priority: false,
    width: 800,
    quality: 85,
    batchSize: 6,
    batchDelay: 200
  });
}
