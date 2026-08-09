const CACHE_NAME = 'dailyabc-images-v1';
const VIDEO_CACHE_NAME = 'dailyabc-videos-v1';
const THUMBNAIL_CACHE_NAME = 'dailyabc-thumbnails-v1';
const TTS_CACHE_NAME = 'dailyabc-tts-v1';
const COVER_CACHE_NAME = 'dailyabc-covers-v2';
const CACHE_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
const VIDEO_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for videos
const COVER_CACHE_MAX_ENTRIES = 400; // LRU cap for transformed cover thumbnails

const KEEP_CACHES = [
  CACHE_NAME,
  VIDEO_CACHE_NAME,
  THUMBNAIL_CACHE_NAME,
  TTS_CACHE_NAME,
  COVER_CACHE_NAME,
];

// Install event - setup cache
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - cleanup old caches (preserve TTS cache - permanent)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!KEEP_CACHES.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Helper: Check if URL is a YouTube thumbnail
function isYouTubeThumbnail(url) {
  return url.includes('i.ytimg.com') || url.includes('ytimg.com');
}

// Helper: Check if URL is a video file (self-hosted)
function isVideoFile(url) {
  return url.includes('supabase.co/storage') && 
    (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/videos/'));
}

// Helper: Transformed image request (Supabase render endpoint or ?width= transform)
function isTransformedImage(url) {
  if (!url.includes('supabase.co/storage')) return false;
  if (isVideoFile(url)) return false;
  return url.includes('/render/image/') || url.includes('width=');
}

/**
 * Normalized cache key for transformed images.
 * Keeps only the transform-relevant params (width/quality/format) so that
 * incidental params (tokens, cache-busters) still resolve to the same entry.
 */
function coverCacheKey(url) {
  try {
    const parsed = new URL(url);
    const params = new URLSearchParams();
    ['width', 'quality', 'format'].forEach((key) => {
      const value = parsed.searchParams.get(key);
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ''}`;
  } catch (e) {
    return url;
  }
}

// Trim the cover cache to the max entry count (oldest insertions first)
async function trimCoverCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= COVER_CACHE_MAX_ENTRIES) return;
  const excess = keys.length - COVER_CACHE_MAX_ENTRIES;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}

/**
 * Stale-while-revalidate for transformed cover thumbnails.
 * Repeat visits paint from disk immediately; a background fetch refreshes the entry.
 */
async function handleCoverRequest(request) {
  const cache = await caches.open(COVER_CACHE_NAME);
  const key = coverCacheKey(request.url);
  const cached = await cache.match(key);

  const network = fetch(request)
    .then(async (response) => {
      if (response && response.status === 200) {
        await cache.put(key, response.clone());
        // Re-insert order keeps the newest entries last for the LRU trim
        trimCoverCache(cache);
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;

  const fresh = await network;
  return fresh || new Response('Image unavailable', { status: 503 });
}

// Helper: Check if URL should be cached as an image
function isImageToCaching(url) {
  return url.includes('supabase.co/storage') || 
         url.includes('foxdnspwzhjxjxuicute.supabase.co/storage') ||
         url.includes('/themes/') ||
         url.includes('/assets/book-covers/') ||
         (url.includes('/assets/') && (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.webp')));
}


// Fetch event - cache-first strategy with special handling for different content types
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (event.request.method !== 'GET') return;

  // Phase 0: Transformed cover thumbnails (stale-while-revalidate, normalized key)
  if (isTransformedImage(url)) {
    event.respondWith(handleCoverRequest(event.request));
    return;
  }

  // Phase 1: Cache YouTube thumbnails
  if (isYouTubeThumbnail(url)) {
    event.respondWith(
      caches.open(THUMBNAIL_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving thumbnail from cache:', url);
            return cachedResponse;
          }
          
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
              console.log('[Service Worker] Cached thumbnail:', url);
            }
            return response;
          }).catch(() => cachedResponse);
        });
      })
    );
    return;
  }
  
  // Phase 2: Cache self-hosted videos with range request support
  if (isVideoFile(url)) {
    event.respondWith(
      caches.open(VIDEO_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Handle range requests for video seeking
          const rangeHeader = event.request.headers.get('range');
          
          if (cachedResponse && !rangeHeader) {
            // Check if cache is still fresh
            const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date'));
            const now = new Date();
            
            if (now - cachedDate < VIDEO_CACHE_DURATION) {
              console.log('[Service Worker] Serving video from cache:', url);
              return cachedResponse;
            }
          }
          
          // For range requests or cache miss, fetch from network
          return fetch(event.request).then((response) => {
            // Only cache full responses (status 200), not partial (206)
            if (response && response.status === 200 && !rangeHeader) {
              const responseToCache = response.clone();
              const headers = new Headers(responseToCache.headers);
              headers.append('sw-cache-date', new Date().toISOString());
              
              const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              
              cache.put(event.request, modifiedResponse);
              console.log('[Service Worker] Cached video:', url);
            }
            return response;
          }).catch((error) => {
            console.error('[Service Worker] Video fetch failed:', error);
            return cachedResponse || new Response('Video unavailable', { status: 503 });
          });
        });
      })
    );
    return;
  }
  
  // Original image caching logic
  if (isImageToCaching(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date'));
            const now = new Date();
            
            if (now - cachedDate < CACHE_DURATION) {
              console.log('[Service Worker] Serving from cache:', url);
              return cachedResponse;
            } else {
              console.log('[Service Worker] Cache expired, fetching fresh:', url);
            }
          }
          
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              const headers = new Headers(responseToCache.headers);
              headers.append('sw-cache-date', new Date().toISOString());
              
              const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              
              cache.put(event.request, modifiedResponse);
              console.log('[Service Worker] Cached:', url);
            }
            
            return response;
          }).catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            return cachedResponse || new Response('Network error', { status: 503 });
          });
        });
      })
    );
  }
});

// Message event - for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_NAME),
        caches.delete(VIDEO_CACHE_NAME),
        caches.delete(THUMBNAIL_CACHE_NAME),
        caches.delete(TTS_CACHE_NAME),
        caches.delete(COVER_CACHE_NAME)
      ]).then(() => {
        console.log('[Service Worker] All caches cleared');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
  
  // TTS Cache: Store audio with metadata (permanent - no TTL)
  if (event.data && event.data.type === 'CACHE_TTS_AUDIO') {
    const { cacheKey, audioBlob, wordTimings, metadata } = event.data;
    console.log('[Service Worker] Caching TTS audio:', cacheKey);
    
    event.waitUntil(
      caches.open(TTS_CACHE_NAME).then(async (cache) => {
        try {
          // Store metadata as JSON
          const metadataBlob = new Blob([JSON.stringify({
            wordTimings,
            ...metadata
          })], { type: 'application/json' });
          
          // Store audio blob
          const audioResponse = new Response(audioBlob, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'X-TTS-Cache-Key': cacheKey,
              'X-TTS-Cached-At': new Date().toISOString()
            }
          });
          
          // Store metadata
          const metadataResponse = new Response(metadataBlob, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          await cache.put(`tts-audio://${cacheKey}`, audioResponse);
          await cache.put(`tts-meta://${cacheKey}`, metadataResponse);
          
          console.log('[Service Worker] TTS audio cached successfully:', cacheKey);
          
          if (event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        } catch (error) {
          console.error('[Service Worker] Error caching TTS:', error);
          if (event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
        }
      })
    );
  }
  
  // TTS Cache: Retrieve audio by cache key
  if (event.data && event.data.type === 'GET_TTS_AUDIO') {
    const { cacheKey } = event.data;
    
    event.waitUntil(
      caches.open(TTS_CACHE_NAME).then(async (cache) => {
        try {
          const [audioResponse, metadataResponse] = await Promise.all([
            cache.match(`tts-audio://${cacheKey}`),
            cache.match(`tts-meta://${cacheKey}`)
          ]);
          
          if (audioResponse && metadataResponse) {
            const audioBlob = await audioResponse.blob();
            const metadata = await metadataResponse.json();
            
            console.log('[Service Worker] TTS cache hit:', cacheKey);
            
            if (event.ports[0]) {
              event.ports[0].postMessage({
                audioBlob,
                wordTimings: metadata.wordTimings || [],
                text: metadata.text,
                voiceId: metadata.voiceId,
                cachedAt: metadata.cachedAt
              });
            }
          } else {
            console.log('[Service Worker] TTS cache miss:', cacheKey);
            if (event.ports[0]) {
              event.ports[0].postMessage(null);
            }
          }
        } catch (error) {
          console.error('[Service Worker] Error retrieving TTS:', error);
          if (event.ports[0]) {
            event.ports[0].postMessage(null);
          }
        }
      })
    );
  }
  
  // TTS Cache: Clear all TTS cache
  if (event.data && event.data.type === 'CLEAR_TTS_CACHE') {
    console.log('[Service Worker] Clearing TTS cache');
    
    event.waitUntil(
      caches.delete(TTS_CACHE_NAME).then(() => {
        console.log('[Service Worker] TTS cache cleared');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch((error) => {
        console.error('[Service Worker] Error clearing TTS cache:', error);
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })
    );
  }
  
  // Delete cache for specific book
  if (event.data && event.data.type === 'DELETE_BOOK_CACHE') {
    const bookId = event.data.bookId;
    console.log('[Service Worker] Deleting cache for book:', bookId);
    
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          const deletions = requests
            .filter((req) => req.url.includes(`/${bookId}/`))
            .map((req) => {
              console.log('[Service Worker] Deleting cached URL:', req.url);
              return cache.delete(req);
            });
          return Promise.all(deletions).then(() => {
            if (event.ports[0]) {
              event.ports[0].postMessage({ success: true, deletedCount: deletions.length });
            }
          });
        });
      })
    );
  }
  
  // Delete cache for multiple books (batch operation)
  if (event.data && event.data.type === 'DELETE_BOOKS_CACHE') {
    const bookIds = event.data.bookIds || [];
    console.log('[Service Worker] Batch deleting cache for', bookIds.length, 'books');
    
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          let totalDeleted = 0;
          const deletions = requests
            .filter((req) => {
              return bookIds.some((bookId) => req.url.includes(`/${bookId}/`));
            })
            .map((req) => {
              totalDeleted++;
              return cache.delete(req);
            });
          return Promise.all(deletions).then(() => {
            console.log('[Service Worker] Batch deleted', totalDeleted, 'cached images');
            if (event.ports[0]) {
              event.ports[0].postMessage({ success: true, deletedCount: totalDeleted, bookCount: bookIds.length });
            }
          });
        });
      })
    );
  }
  
  // Prefetch library images
  if (event.data && event.data.type === 'PREFETCH_IMAGES') {
    const urls = event.data.urls || [];
    console.log('[Service Worker] Prefetching', urls.length, 'images');

    event.waitUntil(
      Promise.all([caches.open(CACHE_NAME), caches.open(COVER_CACHE_NAME)]).then(
        ([imageCache, coverCache]) => {
          return Promise.allSettled(
            urls.map((url) => {
              // Transformed thumbnails live in the cover cache under a normalized key
              // so the fetch handler resolves them on the next visit.
              const isCover = isTransformedImage(url);
              const cache = isCover ? coverCache : imageCache;
              const key = isCover ? coverCacheKey(url) : url;

              return cache.match(key).then((existing) => {
                if (existing) return existing;

                return fetch(url)
                  .then((response) => {
                    if (response && response.status === 200) {
                      const headers = new Headers(response.headers);
                      headers.append('sw-cache-date', new Date().toISOString());

                      const modifiedResponse = new Response(response.clone().body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                      });

                      cache.put(key, modifiedResponse);
                    }
                    return response;
                  })
                  .catch((error) => {
                    console.error('[Service Worker] Prefetch failed for:', url, error);
                  });
              });
            })
          ).then(() => {
            trimCoverCache(coverCache);
            if (event.ports[0]) {
              event.ports[0].postMessage({ success: true, count: urls.length });
            }
          });
        }
      )
    );
  }

  
  // Phase 2: Prefetch videos
  if (event.data && event.data.type === 'PREFETCH_VIDEOS') {
    const urls = event.data.urls || [];
    console.log('[Service Worker] Prefetching', urls.length, 'videos');
    
    event.waitUntil(
      caches.open(VIDEO_CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          urls.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response && response.status === 200) {
                  const headers = new Headers(response.headers);
                  headers.append('sw-cache-date', new Date().toISOString());
                  
                  const modifiedResponse = new Response(response.clone().body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                  });
                  
                  cache.put(url, modifiedResponse);
                  console.log('[Service Worker] Prefetched video:', url);
                }
                return response;
              })
              .catch((error) => {
                console.error('[Service Worker] Video prefetch failed for:', url, error);
              });
          })
        ).then(() => {
          if (event.ports[0]) {
            event.ports[0].postMessage({ success: true, count: urls.length });
          }
        });
      })
    );
  }
  
  // Phase 1: Prefetch YouTube thumbnails
  if (event.data && event.data.type === 'PREFETCH_THUMBNAILS') {
    const urls = event.data.urls || [];
    console.log('[Service Worker] Prefetching', urls.length, 'thumbnails');
    
    event.waitUntil(
      caches.open(THUMBNAIL_CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          urls.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response && response.status === 200) {
                  cache.put(url, response.clone());
                  console.log('[Service Worker] Prefetched thumbnail:', url);
                }
                return response;
              })
              .catch((error) => {
                console.error('[Service Worker] Thumbnail prefetch failed for:', url, error);
              });
          })
        ).then(() => {
          if (event.ports[0]) {
            event.ports[0].postMessage({ success: true, count: urls.length });
          }
        });
      })
    );
  }
  
  // Phase 4: Cleanup video cache (LRU eviction)
  if (event.data && event.data.type === 'CLEANUP_VIDEO_CACHE') {
    const videoIds = event.data.videoIds || [];
    console.log('[Service Worker] Cleaning up cache for', videoIds.length, 'videos');
    
    event.waitUntil(
      caches.open(VIDEO_CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          let deletedCount = 0;
          const deletions = requests
            .filter((req) => {
              return videoIds.some((videoId) => req.url.includes(videoId));
            })
            .map((req) => {
              deletedCount++;
              return cache.delete(req);
            });
          return Promise.all(deletions).then(() => {
            console.log('[Service Worker] Cleaned up', deletedCount, 'cached videos');
            if (event.ports[0]) {
              event.ports[0].postMessage({ success: true, deletedCount });
            }
          });
        });
      })
    );
  }
});
