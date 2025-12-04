/**
 * Video caching utilities using Service Worker and LocalStorage
 * Phase 1: YouTube metadata caching
 * Phase 2: Self-hosted video caching with range request support
 * Phase 4: Storage management
 */

// LocalStorage keys
const VIDEO_LIST_CACHE_KEY = 'chairlift-video-list-cache';
const VIDEO_CACHE_TIMESTAMP_KEY = 'chairlift-video-cache-timestamp';
const VIDEO_ACCESS_LOG_KEY = 'chairlift-video-access-log';

// Cache durations
const VIDEO_LIST_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours for video list
const STORAGE_QUOTA_THRESHOLD = 0.8; // 80% quota usage triggers cleanup

export interface CachedVideoList {
  videos: Array<{
    videoId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    durationSeconds: number;
    publishedAt: string;
  }>;
  timestamp: number;
}

/**
 * Phase 1: Save video list to LocalStorage
 */
export function saveVideoListToCache(videos: CachedVideoList['videos']): void {
  try {
    const cacheData: CachedVideoList = {
      videos,
      timestamp: Date.now(),
    };
    localStorage.setItem(VIDEO_LIST_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(VIDEO_CACHE_TIMESTAMP_KEY, String(Date.now()));
  } catch (error) {
    console.warn('[Video Caching] Failed to save video list:', error);
  }
}

/**
 * Phase 1: Get cached video list from LocalStorage
 */
export function getCachedVideoList(): CachedVideoList['videos'] | null {
  try {
    const cached = localStorage.getItem(VIDEO_LIST_CACHE_KEY);
    if (!cached) return null;

    const cacheData: CachedVideoList = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > VIDEO_LIST_CACHE_DURATION;

    if (isExpired) {
      // Return stale data but mark for refresh
      console.log('[Video Caching] Cache expired, returning stale data');
    }

    return cacheData.videos;
  } catch (error) {
    console.warn('[Video Caching] Failed to read video list cache:', error);
    return null;
  }
}

/**
 * Phase 1: Check if video list cache is fresh
 */
export function isVideoListCacheFresh(): boolean {
  try {
    const timestamp = localStorage.getItem(VIDEO_CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    return Date.now() - Number(timestamp) < VIDEO_LIST_CACHE_DURATION;
  } catch {
    return false;
  }
}

/**
 * Phase 2: Prefetch videos to cache via Service Worker
 */
export async function prefetchVideosToCache(videoUrls: string[]): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[Video Caching] Service worker not available');
    return false;
  }

  const validUrls = videoUrls.filter((url) => url && typeof url === 'string');
  if (validUrls.length === 0) return false;

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      console.log(`[Video Caching] Prefetched ${event.data.count} videos`);
      resolve(event.data.success);
    };

    navigator.serviceWorker.controller.postMessage(
      {
        type: 'PREFETCH_VIDEOS',
        urls: validUrls,
      },
      [messageChannel.port2]
    );
  });
}

/**
 * Phase 2: Prefetch YouTube thumbnails to cache
 */
export async function prefetchThumbnailsToCache(thumbnailUrls: string[]): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return false;
  }

  const validUrls = thumbnailUrls.filter(
    (url) => url && (url.includes('ytimg.com') || url.includes('i.ytimg.com'))
  );

  if (validUrls.length === 0) return false;

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      console.log(`[Video Caching] Prefetched ${event.data.count} thumbnails`);
      resolve(event.data.success);
    };

    navigator.serviceWorker.controller.postMessage(
      {
        type: 'PREFETCH_THUMBNAILS',
        urls: validUrls,
      },
      [messageChannel.port2]
    );
  });
}

/**
 * Phase 4: Get storage quota information
 */
export async function getStorageQuota(): Promise<{
  usage: number;
  quota: number;
  usedPercent: number;
}> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return { usage: 0, quota: 0, usedPercent: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const usedPercent = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, usedPercent };
  } catch (error) {
    console.error('[Video Caching] Failed to get storage quota:', error);
    return { usage: 0, quota: 0, usedPercent: 0 };
  }
}

/**
 * Phase 4: Track video access for LRU eviction
 */
export function trackVideoAccess(videoId: string): void {
  try {
    const logString = localStorage.getItem(VIDEO_ACCESS_LOG_KEY);
    const log: Record<string, number> = logString ? JSON.parse(logString) : {};
    log[videoId] = Date.now();
    localStorage.setItem(VIDEO_ACCESS_LOG_KEY, JSON.stringify(log));
  } catch (error) {
    console.warn('[Video Caching] Failed to track video access:', error);
  }
}

/**
 * Phase 4: Get least recently used videos for eviction
 */
export function getLRUVideos(count: number): string[] {
  try {
    const logString = localStorage.getItem(VIDEO_ACCESS_LOG_KEY);
    if (!logString) return [];

    const log: Record<string, number> = JSON.parse(logString);
    const sorted = Object.entries(log)
      .sort(([, a], [, b]) => a - b) // Sort by timestamp ascending (oldest first)
      .slice(0, count)
      .map(([videoId]) => videoId);

    return sorted;
  } catch {
    return [];
  }
}

/**
 * Phase 4: Check if storage cleanup is needed
 */
export async function shouldCleanupStorage(): Promise<boolean> {
  const { usedPercent } = await getStorageQuota();
  return usedPercent > STORAGE_QUOTA_THRESHOLD * 100;
}

/**
 * Phase 4: Request video cache cleanup via Service Worker
 */
export async function cleanupVideoCache(videoIdsToRemove: string[]): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return false;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      console.log(`[Video Caching] Cleaned up ${event.data.deletedCount} cached videos`);
      resolve(event.data.success);
    };

    navigator.serviceWorker.controller.postMessage(
      {
        type: 'CLEANUP_VIDEO_CACHE',
        videoIds: videoIdsToRemove,
      },
      [messageChannel.port2]
    );
  });
}

/**
 * Phase 4: Perform automatic storage cleanup if needed
 */
export async function performStorageCleanupIfNeeded(): Promise<void> {
  const needsCleanup = await shouldCleanupStorage();
  if (!needsCleanup) return;

  console.log('[Video Caching] Storage quota approaching limit, cleaning up...');

  // Get 5 least recently used videos
  const lruVideos = getLRUVideos(5);
  if (lruVideos.length > 0) {
    await cleanupVideoCache(lruVideos);

    // Remove from access log
    try {
      const logString = localStorage.getItem(VIDEO_ACCESS_LOG_KEY);
      if (logString) {
        const log: Record<string, number> = JSON.parse(logString);
        lruVideos.forEach((id) => delete log[id]);
        localStorage.setItem(VIDEO_ACCESS_LOG_KEY, JSON.stringify(log));
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Clear all video caches
 */
export function clearAllVideoCache(): void {
  localStorage.removeItem(VIDEO_LIST_CACHE_KEY);
  localStorage.removeItem(VIDEO_CACHE_TIMESTAMP_KEY);
  localStorage.removeItem(VIDEO_ACCESS_LOG_KEY);
}
