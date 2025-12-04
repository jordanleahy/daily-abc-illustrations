/**
 * Phase 3: Video prefetch hook for new users
 * Prefetches a curated list of educational videos after account creation
 */

import { useEffect, useRef } from 'react';
import { prefetchThumbnailsToCache, performStorageCleanupIfNeeded } from '@/utils/videoCaching';

// Predefined list of high-value educational video thumbnails to prefetch
// These are YouTube thumbnail URLs that will be cached for instant display
const PREDEFINED_THUMBNAILS = [
  'https://i.ytimg.com/vi/default.jpg', // Placeholder - will be replaced with actual video IDs
];

// YouTube thumbnail URL patterns for different quality levels
const getThumbnailUrls = (videoId: string): string[] => [
  `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, // Medium quality
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, // High quality
];

interface UseVideoPrefetchOptions {
  enabled?: boolean;
  videoIds?: string[];
}

/**
 * Hook to prefetch video thumbnails in the background
 * 
 * @param options.enabled - Whether to enable prefetching
 * @param options.videoIds - Optional array of video IDs to prefetch
 */
export function useVideoPrefetch(options: UseVideoPrefetchOptions = {}) {
  const { enabled = true, videoIds = [] } = options;
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (!enabled || hasPrefetched.current) return;

    // Use requestIdleCallback for non-blocking prefetch
    const prefetch = async () => {
      try {
        // First, check if we need to clean up storage
        await performStorageCleanupIfNeeded();

        // Generate thumbnail URLs
        const thumbnailUrls = videoIds.flatMap(getThumbnailUrls);

        if (thumbnailUrls.length > 0) {
          console.log('[Video Prefetch] Prefetching', thumbnailUrls.length, 'thumbnails');
          await prefetchThumbnailsToCache(thumbnailUrls);
        }

        hasPrefetched.current = true;
      } catch (error) {
        console.error('[Video Prefetch] Failed:', error);
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => prefetch(), { timeout: 5000 });
    } else {
      setTimeout(prefetch, 2000);
    }
  }, [enabled, videoIds]);
}

/**
 * Trigger video prefetch for new users after signup
 * Call this after successful account creation
 */
export async function triggerNewUserVideoPrefetch(videoIds?: string[]): Promise<void> {
  // Delay to avoid blocking signup flow
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // Check storage capacity first
    await performStorageCleanupIfNeeded();

    // Prefetch thumbnails for the provided video IDs
    if (videoIds && videoIds.length > 0) {
      const thumbnailUrls = videoIds.flatMap(getThumbnailUrls);
      await prefetchThumbnailsToCache(thumbnailUrls);
    }

    console.log('[Video Prefetch] New user prefetch complete');
  } catch (error) {
    console.error('[Video Prefetch] New user prefetch failed:', error);
  }
}
