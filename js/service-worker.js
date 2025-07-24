// Update this version when you want to force cache refresh
const CACHE_VERSION = '2025-07-24-002';
const CACHE_NAME = `keigo-jp-v${CACHE_VERSION}`;
const FAVORITES_CACHE_NAME = 'keigo-jp-favorites';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/custom.css',
  '/css/fonts.css',
  '/css/blonde.min.css',
  '/js/keyboard-navigation.js',
  '/js/web-vitals.js',
  '/js/favorites.js',
  '/fonts/material-icons.woff',
  '/favicon/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Check favorites cache as well
        return caches.open(FAVORITES_CACHE_NAME)
          .then((cache) => cache.match(event.request))
          .then((favResponse) => {
            if (favResponse) {
              return favResponse;
            }
            
            return fetch(event.request).then(
              (response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
                
                return response;
              }
            );
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, FAVORITES_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_ARTICLE':
        if (event.data.url) {
          cacheArticle(event.data.url);
        }
        break;
        
      case 'UNCACHE_ARTICLE':
        if (event.data.url) {
          uncacheArticle(event.data.url);
        }
        break;
    }
  }
});

async function cacheArticle(url) {
  try {
    const cache = await caches.open(FAVORITES_CACHE_NAME);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response.clone());
      
      // Also cache related assets
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Cache images in the article
      const images = doc.querySelectorAll('img');
      const imagePromises = Array.from(images).map(async (img) => {
        if (img.src && img.src.startsWith('http')) {
          try {
            const imgResponse = await fetch(img.src);
            if (imgResponse.ok) {
              await cache.put(img.src, imgResponse);
            }
          } catch (error) {
            console.error('Failed to cache image:', img.src);
          }
        }
      });
      
      await Promise.all(imagePromises);
      console.log('Article cached:', url);
    }
  } catch (error) {
    console.error('Failed to cache article:', error);
  }
}

async function uncacheArticle(url) {
  try {
    const cache = await caches.open(FAVORITES_CACHE_NAME);
    const deleted = await cache.delete(url);
    if (deleted) {
      console.log('Article uncached:', url);
    }
  } catch (error) {
    console.error('Failed to uncache article:', error);
  }
}