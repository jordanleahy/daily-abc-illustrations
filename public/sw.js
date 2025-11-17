const CACHE_NAME = 'dailyabc-images-v1';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

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
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - cache-first strategy for images
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Cache Supabase storage images, local theme images, and book cover assets
  const shouldCache = url.includes('supabase.co/storage') || 
                      url.includes('foxdnspwzhjxjxuicute.supabase.co/storage') ||
                      url.includes('/themes/') ||
                      url.includes('/assets/book-covers/') ||
                      (url.includes('/assets/') && (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.webp')));
  
  if (shouldCache) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Check if we have a cached response and if it's still fresh
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date'));
            const now = new Date();
            
            // If cache is still fresh (within 30 days), return it immediately
            if (now - cachedDate < CACHE_DURATION) {
              console.log('[Service Worker] Serving from cache:', url);
              return cachedResponse;
            } else {
              console.log('[Service Worker] Cache expired, fetching fresh:', url);
            }
          }
          
          // Fetch from network
          return fetch(event.request).then((response) => {
            // Only cache successful responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              
              // Add cache date header
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
            // If we have any cached version (even expired), return it as fallback
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
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Service Worker] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  // PHASE 3: Delete cache for specific book
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
  
  // PHASE 3: Delete cache for multiple books (batch operation)
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
});
