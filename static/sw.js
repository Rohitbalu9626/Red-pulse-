const CACHE_NAME = 'redpulse-v2-luxury';
const urlsToCache = [
  '/',
  '/dashboard',
  '/register',
  '/request',
  '/sos',
  '/static/css/dashboard-luxury.css',
  '/static/js/dashboard.js',
  '/static/js/global_sos.js',
  '/static/icon-512.png',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.socket.io/4.7.2/socket.io.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Always bypass cache for APIs and WebSockets
  if (event.request.url.includes('/api/') || event.request.url.includes('socket.io')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network First approach for HTML and CSS so we always get the latest code
  event.respondWith(
    fetch(event.request).then(response => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Deletes redpulse-v1
          }
        })
      );
    }).then(() => self.clients.claim()) // Immediately take control of clients
  );
});
