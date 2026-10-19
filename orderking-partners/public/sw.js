/**
 * OrderKing Partner & Kitchen Service Worker
 * Zero-Lag Offline Architecture for restaurant kitchens, KOT display stations,
 * and high-volume billing counters.
 * Zero external dependencies: uses native IndexedDB directly.
 */

const SW_VERSION = "orderking-partner-v3-live-truth";
const CACHE_NAME = `ok-partner-${SW_VERSION}`;
const STATIC_ASSETS = [
  "/offline.html",
  "/favicon.ico",
  "/icon-192.png",
  "/manifest.json",
  "/__grok/manifest.webmanifest",
];

const IDB_NAME = "orderking-partner-sw";
const IDB_VERSION = 1;
const IDB_STORE = "kv";

function openPartnerStore() {
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
    const db = await openPartnerStore();
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
    const db = await openPartnerStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

function isPublicCatalogPath(pathname) {
  return (
    /^\/api\/(menu|catalog|restaurants|categories|items|config)(\/|$)/i.test(pathname) ||
    /^\/api\/(public)(\/|$)/i.test(pathname)
  );
}

function shouldCacheApiResponse(request, response) {
  if (request.method !== "GET" || !response.ok) return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  if (/private|no-store|no-cache/i.test(cacheControl)) return false;
  if (response.headers.has("Set-Cookie")) return false;

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

self.addEventListener("message", (event) => {
  if (event.data && (event.data.type === "SKIP_WAITING" || event.data === "skipWaiting")) {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass payments, telemetry, and event-streams
  if (
    url.hostname.includes("razorpay.com") ||
    url.pathname.startsWith("/api/webhooks/") ||
    url.pathname.startsWith("/api/sync/") ||
    (event.request.headers && event.request.headers.get("Accept")?.includes("text/event-stream"))
  ) {
    return;
  }

  // HTML Entry Points & Navigation requests: NETWORK-FIRST to guarantee live truth and zero stale bundle traps
  const isHtmlRequest =
    event.request.mode === "navigate" ||
    url.pathname === "/" ||
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

  // Partner Catalog & Menu APIs: Stale-While-Revalidate with IndexedDB
  if (url.pathname.startsWith("/api/")) {
    if (event.request.method === "GET" && isPublicCatalogPath(url.pathname)) {
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

          // Return cached catalog instantly for 0-lag kitchen menu browsing
          if (cached?.body != null) {
            event.waitUntil(fetchPromise);
            return new Response(cached.body, {
              status: 200,
              headers: cached.headers || { "Content-Type": "application/json" },
            });
          }

          const fresh = await fetchPromise;
          if (fresh) return fresh;

          return new Response(JSON.stringify({ error: "Partner catalog offline and not cached yet", offline: true }), {
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
  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/food/") ||
      url.pathname.startsWith("/brand/") ||
      url.pathname.startsWith("/__grok/") ||
      /\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2|css|js)$/i.test(url.pathname))
  ) {
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

// Background Sync handler
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-partner-orders" || event.tag === "sync-orders") {
    event.waitUntil(
      (async () => {
        console.log("[Partner SW] Background sync event triggered:", event.tag);
        // Post message to client windows to invoke durable-queue flush
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: "ORDERKING_SYNC_TRIGGER", tag: event.tag });
        }
      })()
    );
  }
});

// Native Web Push notifications for incoming orders and kitchen soundbox
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || "OrderKing Kitchen Alert";
    const options = {
      body: payload.body || "New incoming order requires preparation.",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      vibrate: [200, 100, 200, 100, 400],
      data: payload.data || { url: "/kitchen" },
      tag: payload.tag || "kitchen-order-alert",
      renotify: true,
      requireInteraction: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("OrderKing Kitchen", {
        body: text,
        icon: "/icon-192.png",
        data: { url: "/kitchen" },
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/kitchen";
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
