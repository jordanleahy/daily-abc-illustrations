/**
 * Service Worker utilities for cache management
 */

const IMAGE_CACHE_NAME = 'dailyabc-images-v1';
const VIDEO_CACHE_NAME = 'dailyabc-videos-v1';
const THUMBNAIL_CACHE_NAME = 'dailyabc-thumbnails-v1';

/**
 * Clear all caches (images, videos, thumbnails)
 */
export async function clearAllCaches(): Promise<boolean> {
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
 * Clear the image cache only
 * @deprecated Use clearAllCaches() instead
 */
export async function clearImageCache(): Promise<boolean> {
  return clearAllCaches();
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
}

/**
 * Get cache statistics (number of cached items across all caches)
 */
export async function getCacheStats(): Promise<{ 
  images: number; 
  videos: number; 
  thumbnails: number;
  total: number;
}> {
  if ('caches' in window) {
    try {
      const [imageCache, videoCache, thumbnailCache] = await Promise.all([
        caches.open(IMAGE_CACHE_NAME).then(cache => cache.keys()),
        caches.open(VIDEO_CACHE_NAME).then(cache => cache.keys()).catch(() => []),
        caches.open(THUMBNAIL_CACHE_NAME).then(cache => cache.keys()).catch(() => []),
      ]);
      
      return { 
        images: imageCache.length,
        videos: videoCache.length,
        thumbnails: thumbnailCache.length,
        total: imageCache.length + videoCache.length + thumbnailCache.length,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { images: 0, videos: 0, thumbnails: 0, total: 0 };
    }
  }
  return { images: 0, videos: 0, thumbnails: 0, total: 0 };
}
