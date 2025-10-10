/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals -- service worker needs self */


const STATIC_CACHE_PREFIX = 'fermagtg-static';
// The cache version only needs to change when we want to invalidate the entire
// static cache namespace. Normal deployments install a fresh service worker,
// repopulate the cache, and take control without requiring a manual version
// bump.

//IMPORTANT!!!!!!
//IF NEED TO FORCE UPDATE ON OLD INSTANCES
//BUMP UP THE V#
const CACHE_VERSION = `${STATIC_CACHE_PREFIX}-V1`;
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
  '/logo512.png',
  '/fonts.css'
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
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => caches.match(event.request));
      })
    );
  }
});