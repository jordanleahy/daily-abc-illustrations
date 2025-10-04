/**
 * Service Worker utilities for cache management
 */

/**
 * Clear the image cache
 * Useful for debugging or forcing fresh image loads
 */
export async function clearImageCache(): Promise<boolean> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }
  return false;
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
}

/**
 * Get cache statistics (number of cached items)
 */
export async function getCacheStats(): Promise<{ count: number; size?: number }> {
  if ('caches' in window) {
    try {
      const cache = await caches.open('dailyabc-images-v1');
      const keys = await cache.keys();
      return { count: keys.length };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { count: 0 };
    }
  }
  return { count: 0 };
}
