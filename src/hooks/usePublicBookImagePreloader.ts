import { useImagePreloader } from './useImagePreloader';
import type { Page } from '@/types/book';

/**
 * Hook to preload and cache public book page images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 3 visible pages for immediate display
 */
export function usePublicBookImagePreloader(pages: Page[] | undefined, bookId: string | undefined) {
  // Extract image URLs from pages
  const imageUrls = pages?.map(page => {
    // Public pages use page_image_urls table, construct the URL
    if (bookId && page.id) {
      return `https://foxdnspwzhjxjxuicute.supabase.co/storage/v1/object/public/page-images/${bookId}/${page.id}.png`;
    }
    return null;
  }).filter(Boolean) || [];
  
  // Split into priority (first 3) and remaining batches
  const priorityUrls = imageUrls.slice(0, 3);
  const remainingUrls = imageUrls.slice(3);
  
  // Preload priority images immediately
  useImagePreloader(priorityUrls, {
    priority: true,
    width: 1200,
    quality: 85,
    batchSize: 3,
    batchDelay: 0
  });
  
  // Preload remaining images with batching
  useImagePreloader(remainingUrls, {
    priority: false,
    width: 1200,
    quality: 85,
    batchSize: 6,
    batchDelay: 200
  });
}
