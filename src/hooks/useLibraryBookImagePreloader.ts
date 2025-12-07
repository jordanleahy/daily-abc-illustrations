import { useMemo } from 'react';
import { useBookPageImages } from './useBookPageImages';
import { useTypedImagePreloader } from './useTypedImagePreloader';
import type { Page } from '@/types/book';

/**
 * Hook to preload and cache library book images for instant display
 * Uses page_image_urls table via useBookPageImages (RLS-safe)
 * Prioritizes first 3 visible pages for immediate display
 */
export function useLibraryBookImagePreloader(bookId: string | undefined, pages: Page[] | undefined) {
  const { data: imageMap = {} } = useBookPageImages(bookId);
  
  // Create array of pages with their image URLs
  const pagesWithImages = useMemo(() => {
    if (!pages || !imageMap) return [];
    return pages.map(page => ({
      ...page,
      imageUrl: imageMap[page.page_number]
    }));
  }, [pages, imageMap]);

  useTypedImagePreloader(
    pagesWithImages,
    page => page.imageUrl,
    { priorityCount: 3, width: 1200, batchSize: 6, batchDelay: 200 }
  );
}
