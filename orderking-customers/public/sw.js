/**
 * OrderKing Customer Service Worker
 * Offline-first delivery for weak/unstable networks.
 * No third-party runtime dependency: IndexedDB is used directly so offline
 * storage still works when external CDNs are unreachable.
 */

const CACHE_NAME = "orderking-customer-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.jpg",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
];

const IDB_NAME = "orderking-sw";
const IDB_VERSION = 1;
const IDB_STORE = "kv";

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

async function idbDelete(key) {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function shouldCacheApiResponse(request, response) {
  if (request.method !== "GET" || !response.ok) return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  if (/private|no-store|no-cache/i.test(cacheControl)) return false;
  if (response.headers.has("Set-Cookie")) return false;

  // Cache only explicitly public/catalog-style API paths. Never cache
  // orders, wallets, payments, profiles, auth/session, support or finance data.
  const path = new URL(request.url).pathname;
  const isPublicCatalog =
    /^\/api\/(restaurants|menu|catalog|search|cities|zones|locations|config)(\/|$)/i.test(path) ||
    /^\/api\/(public)(\/|$)/i.test(path);
  return isPublicCatalog;
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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never treat an offline order as a confirmed order.
  if (event.request.method === "POST" && url.pathname.includes("/api/orders/create")) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request.clone());
        } catch {
          const body = await event.request.clone().text();
          const queue = (await idbGet("offline-order-queue")) || [];
          queue.push({
            id: crypto.randomUUID(),
            url: event.request.url,
            body,
            timestamp: Date.now(),
          });
          await idbSet("offline-order-queue", queue);

          if ("sync" in self.registration) {
            try {
              await self.registration.sync.register("sync-orders");
            } catch {
              // Background Sync may be unavailable; the queue remains durable in IndexedDB.
            }
          }

          return new Response(
            JSON.stringify({
              queued: true,
              status: "OFFLINE_QUEUED",
              message: "Order saved on this device and waiting for network recovery. It is not confirmed yet.",
            }),
            {
              status: 202,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })()
    );
    return;
  }

  // GET APIs: network-first, with per-URL IndexedDB fallback only when the
  // server response does not explicitly mark the response private/no-store.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request.clone())
        .then(async (response) => {
          if (shouldCacheApiResponse(event.request, response)) {
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
        .catch(async () => {
          if (event.request.method === "GET") {
            try {
              const cached = await idbGet("api:" + url.href);
              if (cached?.body != null) {
                return new Response(cached.body, {
                  status: 200,
                  headers: cached.headers || { "Content-Type": "application/json" },
                });
              }
            } catch {}
          }
          return new Response(JSON.stringify({ error: "Network unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // Static assets: cache-first with background refresh.
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
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match("/offline.html");
          return cached;
        });

      return cached || refresh;
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "sync-orders") return;

  event.waitUntil(
    (async () => {
      const queue = (await idbGet("offline-order-queue")) || [];
      if (!queue.length) return;

      const remaining = [];
      for (const order of queue) {
        try {
          const res = await fetch(order.url, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": order.id,
              "X-OrderKing-Offline-Replay": "1",
            },
            body: order.body,
          });
          if (!res.ok) throw new Error("Order sync rejected: " + res.status);
        } catch {
          remaining.push(order);
        }
      }

      if (remaining.length) await idbSet("offline-order-queue", remaining);
      else await idbDelete("offline-order-queue");
    })()
  );
});
