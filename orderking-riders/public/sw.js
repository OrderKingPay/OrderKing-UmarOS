/**
 * OrderKing Rider & Fleet Delivery Service Worker
 * Zero-Lag 2G Offline Architecture for high-speed couriers, basement parking,
 * and patchy cellular connectivity.
 * Zero external dependencies: uses native IndexedDB directly.
 */

const CACHE_NAME = "orderking-rider-v4";
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/icon-192.png",
  "/__grok/manifest.webmanifest",
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

  // HTML Entry Points & Navigation requests: NETWORK-FIRST to guarantee live truth and zero stale bundle traps
  const isHtmlRequest =
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname === "/login" ||
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
          return caches.match("/");
        })
    );
    return;
  }

  // Rider Catalog, Zones & Configuration: Stale-While-Revalidate with IndexedDB
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

          // Return cached data immediately for 0-latency rider UI
          if (cached?.body != null) {
            event.waitUntil(fetchPromise);
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

  // Static assets (CSS, JS, WebAssembly, fonts, icons): cache-first with background revalidation.
  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const refresh = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);

        return cached || refresh;
      })
    );
  }
});

// Background Sync handler for Rider actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-rider-actions" || event.tag === "sync-orders") {
    event.waitUntil(
      (async () => {
        console.log("[Rider SW] Background sync event triggered:", event.tag);
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
    const title = payload.title || "OrderKing Dispatch Offer";
    const options = {
      body: payload.body || "New high-payout delivery offer available nearby!",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      vibrate: [300, 100, 300, 100, 600],
      data: payload.data || { url: "/" },
      tag: payload.tag || "rider-dispatch-alert",
      renotify: true,
      requireInteraction: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("OrderKing Rider", {
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
