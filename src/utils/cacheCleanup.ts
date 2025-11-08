/**
 * PHASE 4: Automatic cache cleanup for stale library books
 * Removes cached images for books not viewed in 7+ days
 */

import { getStaleBooks } from './bookViewTracking';
import { clearLibraryCache } from './libraryCache';

/**
 * Clean up cache for books not viewed in the specified number of days
 * @param daysThreshold Number of days before considering a book stale (default: 7)
 */
export async function cleanupStaleBookCaches(daysThreshold: number = 7): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      console.warn('[Cache Cleanup] Service worker not available');
      return;
    }

    const staleBooks = getStaleBooks(daysThreshold);
    
    if (staleBooks.length === 0) {
      console.log('[Cache Cleanup] No stale books to clean up');
      return;
    }

    console.log(`[Cache Cleanup] Found ${staleBooks.length} stale books (not viewed in ${daysThreshold} days)`);

    // Send batch deletion message to service worker for images
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log(`[Cache Cleanup] Successfully deleted ${event.data.deletedCount} cached images for ${event.data.bookCount} books`);
          
          // Clean up localStorage tracking entries
          staleBooks.forEach(bookId => {
            try {
              localStorage.removeItem(`book-last-viewed-${bookId}`);
            } catch (error) {
              console.warn(`[Cache Cleanup] Failed to remove localStorage entry for ${bookId}:`, error);
            }
          });
          
          // Also clear library metadata cache to force refresh on next visit
          clearLibraryCache();
          console.log('[Cache Cleanup] Cleared library metadata cache');
          
          resolve();
        } else {
          reject(new Error('Cache cleanup failed'));
        }
      };

      navigator.serviceWorker.controller.postMessage(
        {
          type: 'DELETE_BOOKS_CACHE',
          bookIds: staleBooks
        },
        [messageChannel.port2]
      );
    });
  } catch (error) {
    console.error('[Cache Cleanup] Failed to cleanup stale caches:', error);
  }
}

/**
 * Schedule automatic cache cleanup
 * Runs on app mount and then every 24 hours
 */
export function scheduleCacheCleanup(): void {
  // Run cleanup on mount
  cleanupStaleBookCaches().catch(error => {
    console.error('[Cache Cleanup] Initial cleanup failed:', error);
  });

  // Schedule daily cleanup (every 24 hours)
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const intervalId = setInterval(() => {
    cleanupStaleBookCaches().catch(error => {
      console.error('[Cache Cleanup] Scheduled cleanup failed:', error);
    });
  }, CLEANUP_INTERVAL);

  // Also run cleanup when page becomes visible (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // User returned to tab - run cleanup in background
      setTimeout(() => {
        cleanupStaleBookCaches().catch(error => {
          console.error('[Cache Cleanup] Visibility cleanup failed:', error);
        });
      }, 5000); // Wait 5 seconds after tab becomes visible
    }
  });

  // Store interval ID for potential cleanup
  if (typeof window !== 'undefined') {
    (window as any).__cacheCleanupIntervalId = intervalId;
  }
}

/**
 * Get cache statistics (for debugging/admin UI)
 */
export async function getCacheInfo(): Promise<{
  totalCached: number;
  trackedBooks: number;
  staleBooks: number;
}> {
  try {
    const staleBooks = getStaleBooks(7);
    
    // Count tracked books
    let trackedBooks = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('book-last-viewed-')) {
        trackedBooks++;
      }
    }

    // Get total cached items from service worker
    let totalCached = 0;
    if ('caches' in window) {
      const cache = await caches.open('dailyabc-images-v1');
      const keys = await cache.keys();
      totalCached = keys.length;
    }

    return {
      totalCached,
      trackedBooks,
      staleBooks: staleBooks.length
    };
  } catch (error) {
    console.error('[Cache Cleanup] Failed to get cache info:', error);
    return { totalCached: 0, trackedBooks: 0, staleBooks: 0 };
  }
}
