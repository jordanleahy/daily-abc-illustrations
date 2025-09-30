import { useEffect } from 'react';

interface Book {
  id: string;
  firstPageImageUrl?: string;
}

/**
 * Hook to preload critical book thumbnail images
 * Preloads first 2 images immediately, next 4 after 1 second delay
 */
export function useImagePreloading(books: Book[] | undefined) {
  useEffect(() => {
    if (!books || books.length === 0) return;

    // Preload first 2 critical book thumbnails immediately
    const criticalBooks = books.slice(0, 2);
    
    criticalBooks.forEach((book) => {
      if (book.firstPageImageUrl) {
        const img = new Image();
        img.src = book.firstPageImageUrl;
      }
    });

    // Preload next 4 books with lower priority (delayed)
    const timeoutId = setTimeout(() => {
      const secondaryBooks = books.slice(2, 6);
      
      secondaryBooks.forEach((book) => {
        if (book.firstPageImageUrl) {
          const img = new Image();
          img.src = book.firstPageImageUrl;
        }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [books]);
}
