/**
 * TTS Audio Caching Utilities
 * Permanent cache - audio is deterministic (same text + voice = same audio forever)
 * Uses two-tier caching: in-memory (instant) + Service Worker (persistent)
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
 * In-memory cache for instant access (< 1ms vs 50-100ms for Service Worker)
 * This is the first tier of our two-tier cache system
 */
const memoryCache = new Map<string, TTSCacheEntry>();

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
 * Get TTS audio from cache (memory first, then Service Worker)
 * Returns null if not cached
 */
export async function getTTSFromCache(cacheKey: string): Promise<TTSCacheEntry | null> {
  // Tier 1: Check in-memory cache first (instant)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached) {
    console.log('[TTS Cache] Memory hit:', cacheKey);
    return memoryCached;
  }
  
  // Tier 2: Fall back to Service Worker cache
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
      const result = event.data;
      
      // Populate memory cache from Service Worker hit for future instant access
      if (result?.audioBlob) {
        console.log('[TTS Cache] SW hit, promoting to memory:', cacheKey);
        memoryCache.set(cacheKey, result);
      }
      
      resolve(result);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_TTS_AUDIO', cacheKey },
      [channel.port2]
    );
  });
}

/**
 * Store TTS audio in cache (memory + Service Worker)
 * Audio is stored permanently (no TTL) since TTS is deterministic
 */
export async function cacheTTSAudio(
  cacheKey: string,
  audioBlob: Blob,
  wordTimings: WordTiming[],
  text: string,
  voiceId: string
): Promise<boolean> {
  const cachedAt = new Date().toISOString();
  
  // Tier 1: Store in memory immediately for instant access
  const entry: TTSCacheEntry = {
    audioBlob,
    wordTimings,
    text,
    voiceId,
    cachedAt
  };
  memoryCache.set(cacheKey, entry);
  console.log('[TTS Cache] Stored in memory:', cacheKey);
  
  // Tier 2: Persist to Service Worker for cross-session persistence
  if (!navigator.serviceWorker?.controller) {
    console.log('[TTS Cache] Service worker not available for persistence');
    return true; // Memory cache succeeded
  }
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.log('[TTS Cache] Timeout waiting for SW cache confirmation');
      resolve(true); // Memory cache succeeded even if SW fails
    }, 5000);
    
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data?.success ?? true);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { 
        type: 'CACHE_TTS_AUDIO', 
        cacheKey, 
        audioBlob, 
        wordTimings,
        metadata: { text, voiceId, cachedAt }
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
  
  // Use 'default' to match useTextToSpeech.speak() cache key generation
  const effectiveVoiceId = voiceId || 'default';
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
      
      const SUPABASE_URL = 'https://foxdnspwzhjxjxuicute.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI';
      
      // Only include voiceId if explicitly provided (let server use default otherwise)
      const bodyPayload: Record<string, unknown> = { text, withTimestamps: true };
      if (voiceId) {
        bodyPayload.voiceId = voiceId;
      }
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
 * Clear all TTS cache (memory + Service Worker)
 */
export async function clearTTSCache(): Promise<boolean> {
  // Clear memory cache
  memoryCache.clear();
  console.log('[TTS Cache] Memory cache cleared');
  
  // Clear the request queue's tracking
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
