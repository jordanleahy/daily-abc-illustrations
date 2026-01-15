/**
 * TTS Audio Caching Utilities
 * Permanent cache - audio is deterministic (same text + voice = same audio forever)
 */

import { ttsRequestQueue } from './ttsRequestQueue';

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
 * Check if TTS audio is already cached (lightweight check)
 */
export async function isTTSCached(cacheKey: string): Promise<boolean> {
  const cached = await getTTSFromCache(cacheKey);
  return cached?.audioBlob != null;
}

/**
 * Prefetch TTS audio for given text (silent - no playback)
 * Useful for preloading upcoming page audio
 * Returns true if successfully prefetched or already cached
 * Uses global request queue to prevent 429 rate limit errors
 */
export async function prefetchTTSAudio(
  text: string,
  voiceId?: string
): Promise<boolean> {
  if (!text?.trim()) return false;
  
  // Use empty string for cache key when no voiceId (will use server default)
  const effectiveVoiceId = voiceId || '';
  const cacheKey = generateTTSCacheKey(text, effectiveVoiceId);
  
  // Check global tracking first (prevents duplicate in-flight requests)
  if (ttsRequestQueue.isPrefetched(cacheKey)) {
    console.log('[TTS Prefetch] Already prefetched/in-progress:', text.slice(0, 30));
    return true;
  }
  
  // Mark as being processed immediately to prevent duplicates
  ttsRequestQueue.markPrefetched(cacheKey);
  
  // Check if already cached in Service Worker
  const cached = await getTTSFromCache(cacheKey);
  if (cached?.audioBlob) {
    console.log('[TTS Prefetch] Already cached:', text.slice(0, 30));
    return true;
  }
  
  // Queue the API request to prevent rate limiting
  return ttsRequestQueue.enqueue(async () => {
    try {
      console.log('[TTS Prefetch] Fetching:', text.slice(0, 30));
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Only include voiceId if explicitly provided (let server use default otherwise)
      const bodyPayload: Record<string, unknown> = { text, withTimestamps: true };
      if (voiceId) {
        bodyPayload.voiceId = voiceId;
      }
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(bodyPayload),
        }
      );
      
      if (!response.ok) {
        console.warn('[TTS Prefetch] API error:', response.status);
        return false;
      }
      
      const data = await response.json();
      
      // Convert base64 to blob
      const binaryString = atob(data.audio_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const timings = data.wordTimings || [];
      
      // Store in cache
      const success = await cacheTTSAudio(cacheKey, audioBlob, timings, text, effectiveVoiceId);
      if (success) {
        console.log('[TTS Prefetch] Cached:', text.slice(0, 30));
      }
      return success;
    } catch (error) {
      console.warn('[TTS Prefetch] Failed:', error);
      return false;
    }
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
  // Also clear the request queue's tracking
  ttsRequestQueue.clearPrefetchedTracking();
  
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
