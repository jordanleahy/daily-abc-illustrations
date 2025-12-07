import { useTypedImagePreloader } from './useTypedImagePreloader';
import type { Page } from '@/types/book';

/**
 * Hook to preload and cache public book page images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 3 visible pages for immediate display
 * 
 * ⚠️ IMPORTANT: This hook manually constructs storage URLs and should ONLY
 * be used for public/daily published pages where page_image_urls lookup is not available.
 * 
 * For library books, use useLibraryBookImagePreloader instead, which safely
 * fetches URLs via useBookPageImages and respects RLS policies.
 */
export function usePublicBookImagePreloader(pages: Page[] | undefined, bookId: string | undefined) {
  useTypedImagePreloader(
    pages,
    page => {
      if (bookId && page.id) {
        return `https://foxdnspwzhjxjxuicute.supabase.co/storage/v1/object/public/page-images/${bookId}/${page.id}.png`;
      }
      return null;
    },
    { priorityCount: 3, width: 1200, batchSize: 6, batchDelay: 200 }
  );
}
