import { useEffect } from 'react';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

/**
 * Hook to preload library book images for instant display
 * Images are cached by the service worker for 7 days
 */
export function useLibraryImagePreloader(books: DailyPublishedWithBook[] | undefined) {
  useEffect(() => {
    if (!books || books.length === 0) return;

    // Preload first 6 book images immediately (2 rows on desktop)
    const criticalBooks = books.slice(0, 6);
    criticalBooks.forEach((book) => {
      if (book.og_image_url) {
        const img = new Image();
        img.src = book.og_image_url;
      }
    });

    // Preload remaining images after 300ms
    if (books.length > 6) {
      const timeoutId = setTimeout(() => {
        const remainingBooks = books.slice(6);
        remainingBooks.forEach((book) => {
          if (book.og_image_url) {
            const img = new Image();
            img.src = book.og_image_url;
          }
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [books]);
}
