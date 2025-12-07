import { useTypedImagePreloader } from './useTypedImagePreloader';

/**
 * Hook to preload and cache editor book thumbnail images for instant display
 * Uses unified image preloader with service worker caching
 * Prioritizes first 6 images for immediate display
 */
export function useEditorImagePreloader(books: any[] | undefined) {
  useTypedImagePreloader(
    books,
    book => book.coverImageUrl || book.firstPageImageUrl,
    { priorityCount: 6, width: 800, batchSize: 6, batchDelay: 200 }
  );
}
