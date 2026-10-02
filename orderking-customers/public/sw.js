/**
 * OrderKing Customer Service Worker
 *
 * Safe offline-first behavior:
 * - Cache the application shell/static assets for fast repeat loads.
 * - Cache successful GET API responses for read-only degraded viewing.
 * - Never manufacture an accepted/paid/placed response for an offline mutation.
 *
 * A food order, payment, refund, wallet transfer, or other financial mutation
 * is authoritative only after the real server/provider confirms it.
 */

const CACHE_NAME = "orderking-customer-shell-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.jpg",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch {
          // Keep installation resilient when one optional asset is unavailable.
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

async function networkFirst(request, cacheKey) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(cacheKey);
    if (cached) return cached;
    throw new Error("NETWORK_UNAVAILABLE");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Financial/order mutations MUST reach a real server. Never return a fake
  // "success" response while offline.
  if (request.method !== "GET" && url.pathname.startsWith("/api/")) {
    return;
  }

  if (url.pathname.startsWith("/api/") && request.method === "GET") {
    event.respondWith(
      networkFirst(request, "api:" + url.pathname + url.search).catch(
        () =>
          new Response(
            JSON.stringify({
              ok: false,
              code: "NETWORK_UNAVAILABLE",
              message: "Network unavailable. Showing only previously cached information where available.",
            }),
            {
              status: 503,
              headers: { "content-type": "application/json" },
            }
          )
      )
    );
    return;
  }

  // Fast shell/static delivery with a network refresh when available.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const refresh = fetch(request)
        .then(async (response) => {
          if (response.ok && request.method === "GET") {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          return cachedResponse;
        });

      return cachedResponse || refresh;
    })
  );
});
