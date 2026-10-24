"use strict";
// OrderKing Tier-2/Tier-3 Low-Network Resilient Service Worker
const SW_VERSION = "v5.5.2-real-sms-otp-active";
const CACHE_SHELL = `ok-shell-${SW_VERSION}`;
const CACHE_MENUS = `ok-menus-${SW_VERSION}`;
const CACHE_ASSETS = `ok-assets-${SW_VERSION}`;

const SHELL_CACHE = CACHE_SHELL;
const MENU_CACHE = CACHE_MENUS;
const ASSET_CACHE = CACHE_ASSETS;

const IDB_NAME = "orderking-offline-outbox";
const IDB_STORE = "queued_mutations";
const SYNC_TAG = "sync-orderking-mutations";
const NETWORK_FIRST_TIMEOUT_MS = 6500;

const PRECACHE_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.jpg"
];

const EMERGENCY_OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>OrderKing — Low Signal Mode</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .card {
      max-width: 400px;
      width: 100%;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 20px;
      padding: 32px 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      margin-bottom: 20px;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #f59e0b;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    h1 { font-size: 20px; margin: 0 0 12px; font-weight: 700; color: #ffffff; }
    p { font-size: 14px; line-height: 1.5; color: #94a3b8; margin: 0 0 24px; }
    .features {
      background: #0d131f;
      border-radius: 12px;
      padding: 14px;
      font-size: 13px;
      color: #cbd5e1;
      text-align: left;
      margin-bottom: 24px;
      border: 1px solid #1e293b;
    }
    .feature-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .feature-item:last-child { margin-bottom: 0; }
    .check { color: #10b981; font-weight: bold; }
    button {
      background: #10b981;
      color: #022c22;
      font-weight: 700;
      font-size: 15px;
      border: 0;
      padding: 14px 20px;
      border-radius: 12px;
      width: 100%;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    button:active { background: #059669; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Tier-2/Tier-3 Edge Mode</div>
    <h1>Low Network Signal Detected</h1>
    <p>Cell tower connectivity dropped, but OrderKing has safely secured your session locally.</p>
    <div class="features">
      <div class="feature-item"><span class="check">✓</span> Active cart & selections preserved</div>
      <div class="feature-item"><span class="check">✓</span> Rider/order actions queued in offline outbox</div>
      <div class="feature-item"><span class="check">✓</span> Auto-sync will replay once signal returns</div>
    </div>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

function selectRouteStrategy(request) {
  const url = new URL(request.url, "https://orderking.local");
  const method = (request.method || "GET").toUpperCase();
  const mode = request.mode;

  let acceptHeader = "";
  if (request.headers) {
    if (typeof request.headers.get === "function") {
      acceptHeader = request.headers.get("Accept") || "";
    } else {
      acceptHeader = request.headers["Accept"] || request.headers["accept"] || "";
    }
  }

  if (
    url.hostname.includes("razorpay.com") ||
    url.pathname.startsWith("/api/webhooks/") ||
    url.pathname.startsWith("/api/sync/") ||
    acceptHeader.includes("text/event-stream")
  ) {
    return "bypass";
  }

  // Navigation requests: mode === 'navigate' or accept header includes text/html or HTML root
  if (mode === "navigate" || acceptHeader.includes("text/html") || url.pathname === "/" || url.pathname === "/index.html") {
    return "network-first-navigation";
  }

  if (PRECACHE_SHELL_URLS.includes(url.pathname)) {
    return "cache-shell";
  }

  if (
    method === "GET" &&
    (url.pathname.startsWith("/api/restaurants") ||
      url.pathname.startsWith("/api/menu") ||
      /\.(?:png|jpg|jpeg|webp|avif|svg|woff2)$/i.test(url.pathname))
  ) {
    return "stale-while-revalidate";
  }

  if (
    url.pathname.startsWith("/api/checkout") ||
    url.pathname.startsWith("/api/razorpay") ||
    url.pathname.startsWith("/api/orders") ||
    url.pathname.startsWith("/api/rider")
  ) {
    return "network-first";
  }

  if (method === "GET" && url.pathname.startsWith("/assets/")) {
    return "asset-cache-first";
  }

  return "default";
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(CACHE_SHELL);
      await Promise.allSettled(
        PRECACHE_SHELL_URLS.map(
          (url) => shellCache.add(new Request(url, { cache: "reload" }))
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  if (self.clients && self.clients.claim) {
    self.clients.claim();
  }
  event.waitUntil(
    (async () => {
      if (self.clients && self.clients.claim) {
        await self.clients.claim();
      }
      const validCaches = new Set([CACHE_SHELL, CACHE_MENUS, CACHE_ASSETS]);
      const existingNames = await caches.keys();
      await Promise.all(
        existingNames
          .filter((name) => !validCaches.has(name) || !name.includes(SW_VERSION))
          .map((name) => caches.delete(name))
      );
      if (self.registration && self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {}
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && (event.data.type === "SKIP_WAITING" || event.data === "skipWaiting")) {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const strategy = selectRouteStrategy(request);

  switch (strategy) {
    case "bypass":
      return;
    case "network-first-navigation":
      event.respondWith(handleNetworkFirstNavigation(request));
      return;
    case "cache-shell":
      event.respondWith(handleShellCacheOnly(request));
      return;
    case "stale-while-revalidate":
      event.respondWith(handleStaleWhileRevalidate(event, request));
      return;
    case "network-first":
      event.respondWith(handleNetworkFirstCheckoutAndOps(request));
      return;
    case "asset-cache-first":
      event.respondWith(handleImmutableAssetCache(request));
      return;
    case "default":
    default:
      return;
  }
});

async function handleNetworkFirstNavigation(request) {
  const shellCache = await caches.open(CACHE_SHELL);
  try {
    // STRICT Network-First: Always fetch from network when online
    const netResponse = await fetch(request);
    if (netResponse && (netResponse.ok || netResponse.status === 304)) {
      try {
        await shellCache.put("/index.html", netResponse.clone());
        if (request.url) {
          await shellCache.put(request, netResponse.clone());
        }
      } catch {}
      return netResponse;
    }
    return netResponse;
  } catch {
    // Completely offline: fallback to cache ONLY if completely offline
    const cachedShell =
      (await shellCache.match(request)) ||
      (await shellCache.match("/index.html")) ||
      (await shellCache.match("/"));
    if (cachedShell) return cachedShell;
    return new Response(EMERGENCY_OFFLINE_HTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-OrderKing-Offline": "emergency-shell"
      }
    });
  }
}

async function handleShellCacheOnly(request) {
  const shellCache = await caches.open(CACHE_SHELL);
  const exactMatch = await shellCache.match(request);
  if (exactMatch) return exactMatch;
  const appShell = (await shellCache.match("/index.html")) || (await shellCache.match("/"));
  if (appShell) return appShell;
  try {
    const netResponse = await fetchWithTimeout(request, 5000);
    if (netResponse.ok) {
      await shellCache.put("/index.html", netResponse.clone());
    }
    return netResponse;
  } catch {
    return new Response(EMERGENCY_OFFLINE_HTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-OrderKing-Offline": "emergency-shell"
      }
    });
  }
}

async function handleStaleWhileRevalidate(event, request) {
  const menuCache = await caches.open(CACHE_MENUS);
  const cachedResponse = await menuCache.match(request);
  const networkFetchPromise = fetchWithTimeout(request, 6000)
    .then(async (networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const cloned = networkResponse.clone();
        await menuCache.put(request, cloned);
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) {
    if (event && event.waitUntil) {
      event.waitUntil(networkFetchPromise);
    }
    return cachedResponse;
  }

  const freshResponse = await networkFetchPromise;
  if (freshResponse) return freshResponse;

  return new Response(
    JSON.stringify({
      ok: false,
      offline: true,
      error: "Menu temporarily offline. Showing saved catalog.",
      items: []
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-OrderKing-Cache": "OFFLINE-FALLBACK"
      }
    }
  );
}

async function handleNetworkFirstCheckoutAndOps(request) {
  try {
    const response = await fetchWithTimeout(request.clone(), NETWORK_FIRST_TIMEOUT_MS);
    if (request.method === "GET" && response.ok) {
      const cache = await caches.open(CACHE_MENUS);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.method === "GET") {
      const cache = await caches.open(CACHE_MENUS);
      const fallback = await cache.match(request);
      if (fallback) {
        const headers = new Headers(fallback.headers);
        headers.set("X-OrderKing-Stale", "true");
        return new Response(fallback.body, {
          status: fallback.status,
          headers
        });
      }
      return new Response(
        JSON.stringify({
          ok: false,
          offline: true,
          error: "Network connection unstable. Request timed out."
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    if (url.pathname.includes("/razorpay/")) {
      return new Response(
        JSON.stringify({
          ok: false,
          offline: true,
          error: "Network connection unstable. No money was deducted—please retry in a few seconds."
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (request.method === "POST" || request.method === "PATCH") {
      const bodyText = await request.text();
      const mutationId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await enqueueOfflineMutation({
        id: mutationId,
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: bodyText,
        queuedAt: Date.now()
      });

      if (self.registration && "sync" in self.registration) {
        try {
          await self.registration.sync.register(SYNC_TAG);
        } catch {
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          queuedOffline: true,
          message: "Saved to device outbox. Will auto-sync the second 3G/4G signal returns."
        }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: false,
        offline: true,
        error: "Network unavailable. Please retry when connection improves."
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleImmutableAssetCache(request) {
  const assetCache = await caches.open(CACHE_ASSETS);
  const cached = await assetCache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await assetCache.put(request, response.clone());
  }
  return response;
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function openOutboxDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueOfflineMutation(item) {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushOfflineMutations());
  }
});

async function flushOfflineMutations() {
  let db;
  try {
    db = await openOutboxDb();
  } catch {
    return;
  }
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  items.sort((a, b) => a.queuedAt - b.queuedAt);
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          ...item.headers,
          "X-Idempotency-Key": item.id
        },
        body: item.body
      });
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, "readwrite");
          tx.objectStore(IDB_STORE).delete(item.id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}
