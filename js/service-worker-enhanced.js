// Enhanced Service Worker with Advanced Caching Strategies
const CACHE_VERSION = '2025-07-24-003';
const CACHE_PREFIX = 'keigo-jp';
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-v${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-v${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${CACHE_VERSION}`,
  FAVORITES: `${CACHE_PREFIX}-favorites`,
  API: `${CACHE_PREFIX}-api-v${CACHE_VERSION}`
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/css/critical.css',
  '/js/min/dark-mode.min.js',
  '/favicon/favicon.ico'
];

// Static resources with long cache life
const STATIC_RESOURCES = [
  '/css/style.css',
  '/css/custom.css',
  '/css/fonts-optimized.css',
  '/css/blonde.min.css',
  '/css/accessibility.css',
  '/css/mobile-responsive.css',
  '/js/min/core.min.js',
  '/js/min/interactive.min.js',
  '/js/min/keyboard-navigation.min.js',
  '/js/min/web-vitals.min.js',
  '/js/min/favorites.min.js'
];

// Cache strategies
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Route-based caching strategy
const ROUTE_STRATEGIES = [
  { pattern: /\.(?:js|css)$/, strategy: STRATEGIES.CACHE_FIRST, cacheName: CACHE_NAMES.STATIC },
  { pattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/, strategy: STRATEGIES.CACHE_FIRST, cacheName: CACHE_NAMES.IMAGES },
  { pattern: /\.(?:woff|woff2|ttf|otf)$/, strategy: STRATEGIES.CACHE_FIRST, cacheName: CACHE_NAMES.STATIC },
  { pattern: /\/api\//, strategy: STRATEGIES.NETWORK_FIRST, cacheName: CACHE_NAMES.API },
  { pattern: /\.html$/, strategy: STRATEGIES.STALE_WHILE_REVALIDATE, cacheName: CACHE_NAMES.RUNTIME },
  { pattern: /\/$/, strategy: STRATEGIES.STALE_WHILE_REVALIDATE, cacheName: CACHE_NAMES.RUNTIME }
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.STATIC).then(cache => 
        cache.addAll([...CRITICAL_RESOURCES, ...STATIC_RESOURCES])
      ),
      // Pre-cache top posts for offline reading
      caches.open(CACHE_NAMES.RUNTIME).then(cache => 
        fetch('/index.json')
          .then(response => response.json())
          .then(posts => {
            const topPosts = posts.slice(0, 5).map(post => post.url);
            return cache.addAll(topPosts);
          })
          .catch(() => console.log('Could not pre-cache posts'))
      )
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if supported
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      
      // Clean up old caches
      const cacheWhitelist = Object.values(CACHE_NAMES);
      const cacheNames = await caches.keys();
      
      await Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName.startsWith(CACHE_PREFIX) && !cacheWhitelist.includes(cacheName)
          )
          .map(cacheName => caches.delete(cacheName))
      );
      
      // Claim all clients
      await self.clients.claim();
    })()
  );
});

// Fetch strategies implementation
const cacheStrategies = {
  [STRATEGIES.CACHE_FIRST]: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      // Update cache in background
      fetch(request).then(response => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {});
      
      return cached;
    }
    
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  },
  
  [STRATEGIES.NETWORK_FIRST]: async (request, cacheName) => {
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw error;
    }
  },
  
  [STRATEGIES.STALE_WHILE_REVALIDATE]: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    });
    
    return cached || fetchPromise;
  },
  
  [STRATEGIES.CACHE_ONLY]: async (request) => {
    const cached = await caches.match(request);
    if (!cached) throw new Error('No cache match');
    return cached;
  },
  
  [STRATEGIES.NETWORK_ONLY]: async (request) => {
    return fetch(request);
  }
};

// Fetch event handler
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    (async () => {
      // Use navigation preload if available
      if (event.preloadResponse) {
        const response = await event.preloadResponse;
        if (response) return response;
      }
      
      // Find matching route strategy
      const url = new URL(event.request.url);
      const route = ROUTE_STRATEGIES.find(r => r.pattern.test(url.pathname));
      
      if (route) {
        try {
          return await cacheStrategies[route.strategy](event.request, route.cacheName);
        } catch (error) {
          // Fallback to offline page for navigation requests
          if (event.request.mode === 'navigate') {
            const cached = await caches.match('/offline.html');
            if (cached) return cached;
          }
          throw error;
        }
      }
      
      // Default strategy
      return cacheStrategies[STRATEGIES.NETWORK_FIRST](event.request, CACHE_NAMES.RUNTIME);
    })()
  );
});

// Message event handler
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_ARTICLE':
      if (event.data.url) {
        caches.open(CACHE_NAMES.FAVORITES).then(cache => 
          fetch(event.data.url).then(response => {
            if (response && response.status === 200) {
              cache.put(event.data.url, response);
            }
          })
        );
      }
      break;
      
    case 'UNCACHE_ARTICLE':
      if (event.data.url) {
        caches.open(CACHE_NAMES.FAVORITES).then(cache => 
          cache.delete(event.data.url)
        );
      }
      break;
      
    case 'CLEAR_ALL_CACHES':
      caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      ).then(() => 
        event.ports[0].postMessage({ success: true })
      );
      break;
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent());
  }
});

// Helper functions
async function syncFavorites() {
  // Sync favorites with server when back online
  const cache = await caches.open(CACHE_NAMES.FAVORITES);
  const requests = await cache.keys();
  
  return Promise.all(
    requests.map(request => 
      fetch(request).then(response => {
        if (response && response.status === 200) {
          return cache.put(request, response);
        }
      }).catch(() => {})
    )
  );
}

async function updateCachedContent() {
  // Update cached content periodically
  const cache = await caches.open(CACHE_NAMES.RUNTIME);
  const requests = await cache.keys();
  
  return Promise.all(
    requests.slice(0, 10).map(request => 
      fetch(request).then(response => {
        if (response && response.status === 200) {
          return cache.put(request, response);
        }
      }).catch(() => {})
    )
  );
}