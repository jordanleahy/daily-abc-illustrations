/**
 * TTS Audio Caching Utilities
 * Permanent cache - audio is deterministic (same text + voice = same audio forever)
 */

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface TTSCacheEntry {
  audioBlob: Blob;
  wordTimings: WordTiming[];
  text: string;
  voiceId: string;
  cachedAt: string;
}

const TTS_CACHE_NAME = 'dailyabc-tts-v1';

/**
 * Generate unique cache key from text + voice settings
 * Uses a simple hash function for fast key generation
 */
export function generateTTSCacheKey(text: string, voiceId: string): string {
  const str = `${text.toLowerCase().trim()}-${voiceId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `tts-${Math.abs(hash).toString(36)}`;
}

/**
 * Get TTS audio from cache via Service Worker
 * Returns null if not cached or service worker unavailable
 */
export async function getTTSFromCache(cacheKey: string): Promise<TTSCacheEntry | null> {
  if (!navigator.serviceWorker?.controller) {
    console.log('[TTS Cache] Service worker not available');
    return null;
  }
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('[TTS Cache] Timeout waiting for cache response');
      resolve(null);
    }, 2000);
    
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_TTS_AUDIO', cacheKey },
      [channel.port2]
    );
  });
}

/**
 * Store TTS audio in cache via Service Worker
 * Audio is stored permanently (no TTL) since TTS is deterministic
 */
export async function cacheTTSAudio(
  cacheKey: string,
  audioBlob: Blob,
  wordTimings: WordTiming[],
  text: string,
  voiceId: string
): Promise<boolean> {
  if (!navigator.serviceWorker?.controller) {
    console.log('[TTS Cache] Service worker not available for caching');
    return false;
  }
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.log('[TTS Cache] Timeout waiting for cache confirmation');
      resolve(false);
    }, 5000);
    
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data?.success ?? false);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { 
        type: 'CACHE_TTS_AUDIO', 
        cacheKey, 
        audioBlob, 
        wordTimings,
        metadata: { text, voiceId, cachedAt: new Date().toISOString() }
      },
      [channel.port2]
    );
  });
}

/**
 * Get TTS cache statistics
 */
export async function getTTSCacheStats(): Promise<{ count: number }> {
  if (!('caches' in window)) return { count: 0 };
  
  try {
    const cache = await caches.open(TTS_CACHE_NAME);
    const keys = await cache.keys();
    return { count: keys.length };
  } catch (error) {
    console.error('[TTS Cache] Error getting stats:', error);
    return { count: 0 };
  }
}

/**
 * Clear all TTS cache (for settings/manual clear)
 */
export async function clearTTSCache(): Promise<boolean> {
  if (!navigator.serviceWorker?.controller) {
    // Fallback: try direct cache deletion
    if ('caches' in window) {
      try {
        await caches.delete(TTS_CACHE_NAME);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    const timeout = setTimeout(() => {
      resolve(false);
    }, 3000);
    
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data?.success ?? false);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type: 'CLEAR_TTS_CACHE' },
      [channel.port2]
    );
  });
}
