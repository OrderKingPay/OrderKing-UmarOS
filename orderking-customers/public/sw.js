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

function isPublicCatalogPath(pathname) {
  return (
    /^\/api\/(restaurants|menu|catalog|search|cities|zones|locations|config)(\/|$)/i.test(pathname) ||
    /^\/api\/(public)(\/|$)/i.test(pathname)
  );
}

function shouldCacheApiResponse(request, response) {
  if (request.method !== "GET" || !response.ok) return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  if (/private|no-store|no-cache/i.test(cacheControl)) return false;
  if (response.headers.has("Set-Cookie")) return false;

  // Cache only explicitly public/catalog-style API paths. Never cache
  // orders, wallets, payments, profiles, auth/session, support or finance data.
  const path = new URL(request.url).pathname;
  return isPublicCatalogPath(path);
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

  // Navigation requests: fast-network with cache and offline fallback (guaranteed response under 2G/3G timeouts)
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        // Race network fetch with 2200ms timeout on weak/slow 2G/3G mobile networks
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
          // Instantly fallback to cached route, cached root shell (which renders client skeleton in <16ms), or offline.html
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;
          return new Response("<html><body>Offline</body></html>", {
            status: 503,
            headers: { "Content-Type": "text/html" },
          });
        }
      })()
    );
    return;
  }

  // Public Catalog & Menu APIs: Stale-While-Revalidate with IndexedDB
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET" && isPublicCatalogPath(url.pathname)) {
      event.respondWith(
        (async () => {
          const cached = await idbGet("api:" + url.href).catch(() => null);
          const fetchPromise = fetch(event.request.clone())
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
            .catch(() => null);

          // If cached catalog is available, return immediately (Zero-Lag offline browsing)
          if (cached?.body != null) {
            event.waitUntil(fetchPromise);
            return new Response(cached.body, {
              status: 200,
              headers: cached.headers || { "Content-Type": "application/json" },
            });
          }

          const fresh = await fetchPromise;
          if (fresh) return fresh;

          return new Response(JSON.stringify({ error: "Catalog offline and not cached yet", offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })()
      );
      return;
    }

    // Other GET APIs: network-first with IndexedDB fallback
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

  // Static assets (CSS, JS, WebAssembly, fonts, images): cache-first with background revalidation.
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

// Native Web Push notifications (W3C RFC 8291/8292 VAPID)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || "OrderKing Notification";
    const options = {
      body: payload.body || "",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      vibrate: [100, 50, 100],
      data: payload.data || { url: "/" },
      tag: payload.tag || "orderking-alert",
      renotify: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("OrderKing", {
        body: text,
        icon: "/icon-192.png",
        data: { url: "/" },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
