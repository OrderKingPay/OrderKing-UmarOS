/**
 * OrderKing Delivery Partner Service Worker
 * Clean, Zero-Lag Network-First Architecture for couriers.
 * Prevents stale bundle traps and ensures live production truth.
 */

const SW_VERSION = "ok-rider-v9-live-truth";
const CACHE_NAME = `ok-rider-${SW_VERSION}`;
const STATIC_ASSETS = [
  "/offline.html",
  "/favicon.ico",
  "/icon-192.png",
  "/manifest.json",
];

const IDB_NAME = "orderking-rider-sw";
const IDB_VERSION = 1;
const IDB_STORE = "kv";

function openRiderStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openRiderStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key, value) {
  try {
    const db = await openRiderStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

function isRiderCatalogPath(pathname) {
  return (
    /^\/api\/(rider|zones|locations|config|earnings|incentives)(\/|$)/i.test(pathname) ||
    /^\/api\/(public)(\/|$)/i.test(pathname)
  );
}

function shouldCacheApiResponse(request, response) {
  if (request.method !== "GET" || !response.ok) return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  if (/private|no-store|no-cache/i.test(cacheControl)) return false;
  if (response.headers.has("Set-Cookie")) return false;

  const path = new URL(request.url).pathname;
  return isRiderCatalogPath(path);
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

  // Bypass payments, live telemetry, and event-streams
  if (
    url.hostname.includes("razorpay.com") ||
    url.pathname.startsWith("/api/webhooks/") ||
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/_serverFn/") ||
    url.pathname.includes("/telemetry/stream")
  ) {
    return;
  }

  // HTML Entry Points & Navigation requests: NETWORK-FIRST to guarantee live truth
  const isHtmlRequest =
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/login" ||
    url.pathname === "/duty" ||
    url.pathname === "/index.html" ||
    url.pathname.endsWith(".html") ||
    (event.request.method === "GET" && (event.request.headers?.get("Accept") || "").includes("text/html"));

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) return offlinePage;
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return caches.match("/offline.html");
        })
    );
    return;
  }

  // Static JavaScript & CSS Bundles: NETWORK-FIRST to prevent stale bundle traps
  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/assets/") || /\.(?:css|js)$/i.test(url.pathname))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static images and fonts: cache-first with network fallback
  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/brand/") ||
      /\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2)$/i.test(url.pathname))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Rider Catalog & Zones APIs: Stale-While-Revalidate with IndexedDB
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET" && isRiderCatalogPath(url.pathname)) {
      event.respondWith(
        (async () => {
          const cached = await idbGet("api:" + url.href);
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

          if (cached?.body != null) {
            return new Response(cached.body, {
              status: 200,
              headers: cached.headers || { "Content-Type": "application/json" },
            });
          }

          const fresh = await fetchPromise;
          if (fresh) return fresh;

          return new Response(JSON.stringify({ error: "Rider network offline and not cached yet", offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })()
      );
      return;
    }

    // Other GET APIs: network-first with IndexedDB fallback
    if (event.request.method === "GET") {
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
            const cached = await idbGet("api:" + url.href);
            if (cached?.body != null) {
              return new Response(cached.body, {
                status: 200,
                headers: cached.headers || { "Content-Type": "application/json" },
              });
            }
            return new Response(JSON.stringify({ error: "Network unavailable" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          })
      );
      return;
    }
  }
});

// Background Sync handler for Rider actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-rider-actions" || event.tag === "sync-orders") {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: "ORDERKING_RIDER_SYNC_TRIGGER", tag: event.tag });
        }
      })()
    );
  }
});

// Native Web Push notifications for instant order dispatch offers & surge boosts
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(
      self.registration.showNotification(payload.title || "OrderKing Delivery", {
        body: payload.body || "New dispatch offer available near your location.",
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/icon-192.png",
        vibrate: [200, 100, 200, 100, 400],
        data: payload.data || { url: "/" },
        tag: payload.tag || "rider-dispatch-alert",
        renotify: true,
        requireInteraction: true,
      })
    );
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("OrderKing Delivery", {
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
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
