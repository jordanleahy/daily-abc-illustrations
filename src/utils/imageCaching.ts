/**
 * Image caching utilities using Service Worker
 */

import { optimizeImageUrl } from './imageOptimization';

export interface PrefetchOptions {
  /** Rendered width — must match what the UI requests so the cache key lines up */
  width?: number;
  /** Rendered quality — must match what the UI requests */
  quality?: number;
}

/**
 * Prefetch and cache images using the service worker
 *
 * Warms exactly ONE variant per image: the same width/quality the UI renders.
 * Warming other sizes produces different URLs (and different cache keys), so
 * they would never be hit by the actual <img> request.
 */
export async function prefetchImagesToCache(
  imageUrls: (string | null | undefined)[],
  options: PrefetchOptions = {}
): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[Image Caching] Service worker not available');
    return false;
  }

  const { width = 800, quality = 85 } = options;

  // Filter out null/undefined and optimize URLs to the rendered variant
  const validUrls = imageUrls
    .filter((url): url is string => !!url && url.includes('supabase.co/storage'))
    .map((url) => optimizeImageUrl(url, { width, quality }))
    .filter((u): u is string => !!u);


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
