/**
 * Image caching utilities using Service Worker
 */

import { optimizeImageUrl } from './imageOptimization';

/**
 * Prefetch and cache images using the service worker
 * Ensures all images are available offline and load instantly
 */
export async function prefetchImagesToCache(imageUrls: (string | null | undefined)[]): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[Image Caching] Service worker not available');
    return false;
  }

  // Filter out null/undefined and optimize URLs
  const validUrls = imageUrls
    .filter((url): url is string => !!url && url.includes('supabase.co/storage'))
    .flatMap((url) => {
      // Cache both optimized and original versions
      return [
        optimizeImageUrl(url, { width: 600, quality: 85 }),
        optimizeImageUrl(url, { width: 800, quality: 85 }),
        optimizeImageUrl(url, { width: 1200, quality: 85 }),
        url // Original
      ].filter((u): u is string => !!u);
    });

  if (validUrls.length === 0) {
    return false;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      console.log(`[Image Caching] Prefetched ${event.data.count} images`);
      resolve(event.data.success);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { 
        type: 'PREFETCH_IMAGES',
        urls: validUrls
      },
      [messageChannel.port2]
    );
  });
}

/**
 * Check if service worker is ready for caching
 */
export function isServiceWorkerReady(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
}
