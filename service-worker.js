const CACHE_NAME = 'nutri-tracker-v1';
const FOOD_CACHE = 'food-cache';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FOOD_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // 🍎 Cas 1 : API Open Food Facts
  if (url.includes('openfoodfacts.org')) {
    event.respondWith(
      caches.open(FOOD_CACHE).then(async cache => {
        try {
          const networkResponse = await fetch(event.request);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          // fallback offline
          const cachedResponse = await cache.match(event.request);
          return cachedResponse;
        }
      })
    );
    return;
  }

  // 📦 Cas 2 : assets de la PWA
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
