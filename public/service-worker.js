/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals -- service worker needs self */


const STATIC_CACHE_PREFIX = 'fermagtg-static';
// One-time migration clears old static responses. Product photos now have
// content versions in their URLs, so future photo changes need no cache bump.
const CACHE_VERSION = `${STATIC_CACHE_PREFIX}-V2`;
// Any cache names that store user data we must never purge on deploy go here.
const PERSISTENT_CACHE_WHITELIST = ['fermagtg-user-orders'];
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robots.txt',
  '/Logo.png',
  '/Logo.avif',
  '/Logo.webp',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => {
        console.error('Service Worker: Pre-cache failed', error);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (
              key !== CACHE_VERSION &&
              key.startsWith(STATIC_CACHE_PREFIX) &&
              !PERSISTENT_CACHE_WHITELIST.includes(key)
            ) {
              return caches.delete(key);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname)) {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  const cacheFirstTypes = ['style', 'script', 'image', 'font'];
  if (cacheFirstTypes.includes(event.request.destination)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const isImage = event.request.destination === 'image';
        const validResponse = (response) => response && response.status === 200 &&
          response.type === 'basic' && (!isImage || (response.headers.get('Content-Type') || '').toLowerCase().startsWith('image/'));
        const cachedResponse = await cache.match(event.request);
        if (validResponse(cachedResponse)) {
          return cachedResponse;
        }
        if (cachedResponse) await cache.delete(event.request);

        return fetch(event.request)
          .then(async (networkResponse) => {
            if (!validResponse(networkResponse)) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            try { await cache.put(event.request, responseToCache); } catch {
              // Full storage must not prevent a successfully loaded image from displaying.
            }

            return networkResponse;
          })
          .catch(() => cache.match(event.request));
      })
    );
  }
});
