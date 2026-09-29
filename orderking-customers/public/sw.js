importScripts('https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js');

const CACHE_NAME = 'orderking-v2-aggressive';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.jpg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Helper for IDB caching
async function getFromIdbOrNetwork(request) {
  const url = new URL(request.url);
  const cacheKey = 'asset_' + url.pathname;
  
  try {
    const cachedRecord = await idbKeyval.get(cacheKey);
    if (cachedRecord) {
      const { headers, body, type } = cachedRecord;
      return new Response(body, { headers: new Headers(headers) });
    }
  } catch (e) {
    console.error('IDB read error', e);
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const blob = await clone.blob();
      const headers = {};
      clone.headers.forEach((v, k) => headers[k] = v);
      
      // Store in IDB for aggressive offline support on 2G/3G
      idbKeyval.set(cacheKey, { body: blob, headers, type: blob.type }).catch(console.error);
      
      // Also put in Cache API
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If offline and not in IDB, try Cache API
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

// Fetch: cache-first for static assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  // API calls: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Aggressive caching using IDB for assets (images, js, css, etc.)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2)$/i) || url.pathname.startsWith('/assets/')) {
    event.respondWith(getFromIdbOrNetwork(request));
    return;
  }

  // General Static assets: cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
    )
  );
});
