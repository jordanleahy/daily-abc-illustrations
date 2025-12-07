import { useMemo } from 'react';
import { useTypedImagePreloader } from './useTypedImagePreloader';

/**
 * Hook to preload and cache book editor page images for instant display
 * Uses unified image preloader with service worker caching and prioritized loading
 */
export function useBookEditorImagePreloader(pageImages: Record<number, string> | undefined) {
  // Convert record to sorted array of entries
  const sortedEntries = useMemo(() => {
    if (!pageImages) return [];
    return Object.entries(pageImages)
      .map(([key, url]) => ({ pageNum: Number(key), url }))
      .sort((a, b) => a.pageNum - b.pageNum);
  }, [pageImages]);

  useTypedImagePreloader(
    sortedEntries,
    entry => entry.url,
    { priorityCount: 3, width: 800, batchSize: 5, batchDelay: 150 }
  );
}
