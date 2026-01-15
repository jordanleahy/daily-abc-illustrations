/**
 * Service Worker utilities for cache management
 */

const IMAGE_CACHE_NAME = 'dailyabc-images-v1';
const VIDEO_CACHE_NAME = 'dailyabc-videos-v1';
const THUMBNAIL_CACHE_NAME = 'dailyabc-thumbnails-v1';
const TTS_CACHE_NAME = 'dailyabc-tts-v1';

/**
 * Clear all caches (images, videos, thumbnails, TTS)
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
  tts: number;
  total: number;
}> {
  if ('caches' in window) {
    try {
      const [imageCache, videoCache, thumbnailCache, ttsCache] = await Promise.all([
        caches.open(IMAGE_CACHE_NAME).then(cache => cache.keys()),
        caches.open(VIDEO_CACHE_NAME).then(cache => cache.keys()).catch(() => []),
        caches.open(THUMBNAIL_CACHE_NAME).then(cache => cache.keys()).catch(() => []),
        caches.open(TTS_CACHE_NAME).then(cache => cache.keys()).catch(() => []),
      ]);
      
      // TTS cache stores 2 entries per audio (audio + metadata), so divide by 2
      const ttsCount = Math.floor(ttsCache.length / 2);
      
      return { 
        images: imageCache.length,
        videos: videoCache.length,
        thumbnails: thumbnailCache.length,
        tts: ttsCount,
        total: imageCache.length + videoCache.length + thumbnailCache.length + ttsCount,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { images: 0, videos: 0, thumbnails: 0, tts: 0, total: 0 };
    }
  }
  return { images: 0, videos: 0, thumbnails: 0, tts: 0, total: 0 };
}
