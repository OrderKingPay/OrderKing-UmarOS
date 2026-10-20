/**
 * Umar OS / HDmaster Service Worker
 * Offline-first & 2G/3G weak-network resilience for Sovereign Founder Command.
 * Includes IndexedDB caching, 2200ms slow-network timeout racing, and instant skeleton shell fallback.
 */

const CACHE_NAME = "hdmaster-command-v3-live";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.jpg",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
];

const IDB_NAME = "hdmaster-sw";
const IDB_VERSION = 1;
const IDB_STORE = "command-kv";

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && (event.data.type === "SKIP_WAITING" || event.data === "skipWaiting")) {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation requests: Fast-network with cache and offline fallback (2200ms timeout on 2G/3G)
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const fetchWithTimeout = new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("Slow 2G/3G navigation timeout")), 2200);
          fetch(event.request)
            .then((res) => {
              clearTimeout(timer);
              if (res.ok) {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
              }
              resolve(res);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });

        try {
          return await fetchWithTimeout;
        } catch {
          // Immediately serve cached HTML shell, enabling instant WorldSkeleton client paint
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;
          return new Response("<html><body>Command Offline</body></html>", {
            status: 503,
            headers: { "Content-Type": "text/html" },
          });
        }
      })()
    );
    return;
  }

  // 2. Telemetry and API requests (GET): Stale-While-Revalidate with IndexedDB
  if (url.pathname.startsWith("/api/")) {
    // Only cache safe GET requests (never mutate or cache sensitive credentials)
    if (event.request.method === "GET") {
      event.respondWith(
        (async () => {
          const cached = await idbGet("api:" + url.href).catch(() => null);
          const fetchPromise = fetch(event.request.clone())
            .then(async (response) => {
              if (response.ok && !response.headers.has("Set-Cookie")) {
                try {
                  await idbSet("api:" + url.href, {
                    status: response.status,
                    headers: Array.from(response.headers.entries()),
                    body: await response.clone().text(),
                    cachedAt: Date.now(),
                  });
                } catch {}
              }
              return response;
            })
            .catch(() => null);

          if (cached?.body != null) {
            event.waitUntil(fetchPromise);
            return new Response(cached.body, {
              status: 200,
              headers: cached.headers || { "Content-Type": "application/json" },
            });
          }

          const fresh = await fetchPromise;
          if (fresh) return fresh;

          return new Response(JSON.stringify({ error: "Network unavailable", offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })()
      );
      return;
    }

    return; // Pass through non-GET API requests
  }

  // 3. Static Assets (CSS, JS chunks, fonts, images): Cache-first with background update
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const refresh = fetch(event.request)
        .then((response) => {
          if (event.request.method === "GET" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);

      return cached || refresh;
    })
  );
});
