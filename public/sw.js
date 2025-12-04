const CACHE_NAME = 'dailyabc-images-v1';
const VIDEO_CACHE_NAME = 'dailyabc-videos-v1';
const THUMBNAIL_CACHE_NAME = 'dailyabc-thumbnails-v1';
const CACHE_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
const VIDEO_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for videos

// Install event - setup cache
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== VIDEO_CACHE_NAME && cacheName !== THUMBNAIL_CACHE_NAME) {
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
        caches.delete(THUMBNAIL_CACHE_NAME)
      ]).then(() => {
        console.log('[Service Worker] All caches cleared');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
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
      caches.open(CACHE_NAME).then((cache) => {
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
                  console.log('[Service Worker] Prefetched:', url);
                }
                return response;
              })
              .catch((error) => {
                console.error('[Service Worker] Prefetch failed for:', url, error);
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
