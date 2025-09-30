import { useEffect } from 'react';
import { getOptimizedImageUrl, hasDataSavingEnabled } from '@/utils/imageOptimization';
import { useResponsiveImageSize } from './useResponsiveImageSize';

interface Book {
  id: string;
  firstPageImageUrl?: string;
}

/**
 * Hook to preload critical book thumbnail images
 * Preloads first 2 images immediately, next 4 after 1 second delay
 * Respects user's data saving preferences
 */
export function useImagePreloading(books: Book[] | undefined) {
  const { width, height } = useResponsiveImageSize();

  useEffect(() => {
    if (!books || books.length === 0) return;

    // Skip preloading if user has data saving enabled
    if (hasDataSavingEnabled()) return;

    // Preload first 2 critical book thumbnails immediately
    const criticalBooks = books.slice(0, 2);
    
    criticalBooks.forEach((book) => {
      if (book.firstPageImageUrl) {
        const optimizedUrl = getOptimizedImageUrl(book.firstPageImageUrl, {
          width,
          height,
        });
        
        if (optimizedUrl) {
          const img = new Image();
          img.src = optimizedUrl;
        }
      }
    });

    // Preload next 4 books with lower priority (delayed)
    const timeoutId = setTimeout(() => {
      const secondaryBooks = books.slice(2, 6);
      
      secondaryBooks.forEach((book) => {
        if (book.firstPageImageUrl) {
          const optimizedUrl = getOptimizedImageUrl(book.firstPageImageUrl, {
            width,
            height,
          });
          
          if (optimizedUrl) {
            const img = new Image();
            img.src = optimizedUrl;
          }
        }
      });
    }, 1000); // Delay to not interfere with critical loading

    return () => clearTimeout(timeoutId);
  }, [books, width, height]);
}
