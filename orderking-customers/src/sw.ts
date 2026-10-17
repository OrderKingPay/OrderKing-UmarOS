// File: src/sw.ts — OrderKing Tier-2/Tier-3 Resilient Low-Network Service Worker
// Architecture: Pre-cached UI Shell, Stale-While-Revalidate Catalogs, 6.5s Network-First Checkout, IndexedDB Outbox & Background Sync

export const SW_VERSION = "orderking-v5.3.0-live-truth";
export const CACHE_SHELL = `ok-shell-${SW_VERSION}`;
export const CACHE_MENUS = `ok-menus-${SW_VERSION}`;
export const CACHE_ASSETS = `ok-assets-${SW_VERSION}`;

// Backward compatibility aliases
export const SHELL_CACHE = CACHE_SHELL;
export const MENU_CACHE = CACHE_MENUS;
export const ASSET_CACHE = CACHE_ASSETS;

export const IDB_NAME = "orderking-offline-outbox";
export const IDB_STORE = "queued_mutations";
export const SYNC_TAG = "sync-orderking-mutations";
export const NETWORK_FIRST_TIMEOUT_MS = 6500;

// Pre-cached immutable UI Shell for Cache-Only instant boot
export const PRECACHE_SHELL_URLS: string[] = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.jpg",
];

export const EMERGENCY_OFFLINE_HTML = `<!DOCTYPE html>
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

export interface QueuedOfflineMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  queuedAt: number;
}

export type RouteStrategy =
  | "bypass"
  | "network-first-navigation"
  | "cache-shell"
  | "stale-while-revalidate"
  | "network-first"
  | "asset-cache-first"
  | "default";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING STRATEGY SELECTION
// ─────────────────────────────────────────────────────────────────────────────
export function selectRouteStrategy(request: {
  url: string;
  method?: string;
  mode?: string;
  headers?: Headers | Record<string, string>;
}): RouteStrategy {
  const url = new URL(request.url, "https://orderking.local");
  const method = (request.method || "GET").toUpperCase();
  const mode = request.mode;

  let acceptHeader = "";
  if (request.headers) {
    if (typeof (request.headers as Headers).get === "function") {
      acceptHeader = (request.headers as Headers).get("Accept") || "";
    } else {
      const h = request.headers as Record<string, string>;
      acceptHeader = h["Accept"] || h["accept"] || "";
    }
  }

  // Bypass cross-origin payment gateways and persistent streaming connections
  if (
    url.hostname.includes("razorpay.com") ||
    url.pathname.startsWith("/api/webhooks/") ||
    url.pathname.startsWith("/api/sync/") ||
    acceptHeader.includes("text/event-stream")
  ) {
    return "bypass";
  }

  // Navigation requests: Network-First to guarantee live truth & prevent cache traps
  if (mode === "navigate") {
    return "network-first-navigation";
  }

  // Pre-cached core assets
  if (PRECACHE_SHELL_URLS.includes(url.pathname)) {
    return "cache-shell";
  }

  // Stale-While-Revalidate: Menus, Restaurant Catalogs, and Media
  if (
    method === "GET" &&
    (url.pathname.startsWith("/api/restaurants") ||
      url.pathname.startsWith("/api/menu") ||
      /\.(?:png|jpg|jpeg|webp|avif|svg|woff2)$/i.test(url.pathname))
  ) {
    return "stale-while-revalidate";
  }

  // Network-First: Checkout, Razorpay order creation, Orders status & Rider mutations
  if (
    url.pathname.startsWith("/api/checkout") ||
    url.pathname.startsWith("/api/razorpay") ||
    url.pathname.startsWith("/api/orders") ||
    url.pathname.startsWith("/api/rider")
  ) {
    return "network-first";
  }

  // Immutable hashed Vite bundles
  if (method === "GET" && url.pathname.startsWith("/assets/")) {
    return "asset-cache-first";
  }

  return "default";
}

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK FETCH HELPER WITH STRICT TIMEOUT
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchWithTimeout(
  request: Request,
  timeoutMs: number,
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. STRATEGY: NETWORK-FIRST NAVIGATION (2.5s Strict Timeout + Fallback)
// ─────────────────────────────────────────────────────────────────────────────
export async function handleNetworkFirstNavigation(
  request: Request,
  cacheProvider?: Cache,
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  const shellCache = cacheProvider || (await caches.open(CACHE_SHELL));

  try {
    const netResponse = await fetchWithTimeout(request, 2500, fetchFn);
    if (netResponse.ok) {
      await shellCache.put("/index.html", netResponse.clone());
    }
    return netResponse;
  } catch {
    const cachedShell =
      (await shellCache.match(request)) ||
      (await shellCache.match("/index.html")) ||
      (await shellCache.match("/"));

    if (cachedShell) {
      return cachedShell;
    }

    return new Response(EMERGENCY_OFFLINE_HTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-OrderKing-Offline": "emergency-shell",
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STRATEGY A: CACHE-ONLY / UI SHELL WITH ZERO WHITE SCREEN GUARANTEE
// ─────────────────────────────────────────────────────────────────────────────
export async function handleShellCacheOnly(
  request: Request,
  cacheProvider?: Cache,
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  const shellCache = cacheProvider || (await caches.open(CACHE_SHELL));

  const exactMatch = await shellCache.match(request);
  if (exactMatch) return exactMatch;

  const appShell =
    (await shellCache.match("/index.html")) || (await shellCache.match("/"));
  if (appShell) return appShell;

  // Cold first visit when install pre-cache experienced total offline failure
  try {
    const netResponse = await fetchWithTimeout(request, 5000, fetchFn);
    if (netResponse.ok) {
      await shellCache.put("/index.html", netResponse.clone());
    }
    return netResponse;
  } catch {
    return new Response(EMERGENCY_OFFLINE_HTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-OrderKing-Offline": "emergency-shell",
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STRATEGY B: STALE-WHILE-REVALIDATE (<15ms Local + Background Network Sync)
// ─────────────────────────────────────────────────────────────────────────────
export async function handleStaleWhileRevalidate(
  request: Request,
  event?: { waitUntil(p: Promise<unknown>): void },
  cacheProvider?: Cache,
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  const menuCache = cacheProvider || (await caches.open(CACHE_MENUS));
  const cachedResponse = await menuCache.match(request);

  const revalidationPromise = fetchWithTimeout(request, 6000, fetchFn)
    .then(async (networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const cloned = networkResponse.clone();
        await menuCache.put(request, cloned);
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) {
    if (event?.waitUntil) {
      event.waitUntil(revalidationPromise);
    }
    return cachedResponse;
  }

  const freshResponse = await revalidationPromise;
  if (freshResponse) return freshResponse;

  return new Response(
    JSON.stringify({
      ok: false,
      offline: true,
      error: "Menu temporarily offline. Showing saved catalog.",
      items: [],
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-OrderKing-Cache": "OFFLINE-FALLBACK",
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STRATEGY C: NETWORK-FIRST (6.5s AbortController + Outbox Queue)
// ─────────────────────────────────────────────────────────────────────────────
export async function handleNetworkFirstCheckoutAndOps(
  request: Request,
  cacheProvider?: Cache,
  fetchFn: typeof fetch = fetch,
  idbFactory?: IDBFactory
): Promise<Response> {
  try {
    const response = await fetchWithTimeout(
      request.clone(),
      NETWORK_FIRST_TIMEOUT_MS,
      fetchFn
    );
    if (request.method === "GET" && response.ok) {
      const cache = cacheProvider || (await caches.open(CACHE_MENUS));
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    // If GET (e.g. order tracking or quote polling), return last cached snapshot
    if (request.method === "GET") {
      const cache = cacheProvider || (await caches.open(CACHE_MENUS));
      const fallback = await cache.match(request);
      if (fallback) {
        const headers = new Headers(fallback.headers);
        headers.set("X-OrderKing-Stale", "true");
        return new Response(fallback.body, {
          status: fallback.status,
          headers,
        });
      }
      return new Response(
        JSON.stringify({
          ok: false,
          offline: true,
          error: "Network connection unstable. Request timed out.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // For POST/PATCH payment creation, NEVER double-queue raw payments
    const url = new URL(request.url);
    if (url.pathname.includes("/razorpay/")) {
      return new Response(
        JSON.stringify({
          ok: false,
          offline: true,
          error:
            "Network connection unstable. No money was deducted—please retry in a few seconds.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Capture failed Rider/Partner mutations into IndexedDB outbox
    if (request.method === "POST" || request.method === "PATCH") {
      const bodyText = await request.text();
      const mutationId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await enqueueOfflineMutation(
        {
          id: mutationId,
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: bodyText,
          queuedAt: Date.now(),
        },
        idbFactory
      );

      // Trigger background sync if supported
      if (swScope?.registration?.sync) {
        try {
          await swScope.registration.sync.register(SYNC_TAG);
        } catch {
          // Sync registration failure handled gracefully
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          queuedOffline: true,
          message:
            "Saved to device outbox. Will auto-sync the second 3G/4G signal returns.",
        }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: false,
        offline: true,
        error: "Network unavailable. Please retry when connection improves.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. STRATEGY D: IMMUTABLE ASSET CACHING FOR VITE CHUNKS
// ─────────────────────────────────────────────────────────────────────────────
export async function handleImmutableAssetCache(
  request: Request,
  cacheProvider?: Cache,
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  const assetCache = cacheProvider || (await caches.open(CACHE_ASSETS));
  const cached = await assetCache.match(request);
  if (cached) return cached;

  const response = await fetchFn(request);
  if (response.ok) {
    await assetCache.put(request, response.clone());
  }
  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INDEXEDDB OUTBOX FOR LOW-NETWORK / OFFLINE MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────
export function openOutboxDb(customIdb?: IDBFactory): Promise<IDBDatabase> {
  const factory =
    customIdb || (typeof indexedDB !== "undefined" ? indexedDB : undefined);
  if (!factory) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const req = factory.open(IDB_NAME, 1);
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

export async function enqueueOfflineMutation(
  item: QueuedOfflineMutation,
  customIdb?: IDBFactory
): Promise<void> {
  const db = await openOutboxDb(customIdb);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedOfflineMutations(
  customIdb?: IDBFactory
): Promise<QueuedOfflineMutation[]> {
  const db = await openOutboxDb(customIdb);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineMutation(
  id: string,
  customIdb?: IDBFactory
): Promise<void> {
  const db = await openOutboxDb(customIdb);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearOfflineOutbox(
  customIdb?: IDBFactory
): Promise<void> {
  const db = await openOutboxDb(customIdb);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BACKGROUND SYNC REPLAY WITH IDEMPOTENCY KEY
// ─────────────────────────────────────────────────────────────────────────────
export async function flushOfflineMutations(
  customIdb?: IDBFactory,
  fetchFn: typeof fetch = fetch
): Promise<{ processed: number; succeeded: number; failed: number }> {
  let items: QueuedOfflineMutation[] = [];
  try {
    items = await getQueuedOfflineMutations(customIdb);
  } catch {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  if (items.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  // Strict FIFO ordering based on when the action occurred on the device
  items.sort((a, b) => a.queuedAt - b.queuedAt);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      processed++;
      const res = await fetchFn(item.url, {
        method: item.method,
        headers: {
          ...item.headers,
          "X-Idempotency-Key": item.id,
        },
        body: item.body,
      });

      // 2xx Success or 4xx Permanent Client Error (e.g. 400 Bad Request, 404 Not Found)
      // Delete from outbox as retry will not change outcome
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await deleteOfflineMutation(item.id, customIdb);
        succeeded++;
      } else {
        // 5xx Server Error: keep in queue for next sync window
        failed++;
        break;
      }
    } catch {
      // Network still down or timed out; halt replay and preserve remaining queue
      failed++;
      break;
    }
  }

  return { processed, succeeded, failed };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SERVICE WORKER LIFECYCLE EVENT WIRING
// ─────────────────────────────────────────────────────────────────────────────
interface ExtendableEventLike extends Event {
  waitUntil(f: Promise<unknown>): void;
}

interface FetchEventLike extends ExtendableEventLike {
  request: Request;
  preloadResponse?: Promise<Response | undefined>;
  respondWith(r: Response | Promise<Response>): void;
}

interface SyncEventLike extends ExtendableEventLike {
  tag: string;
}

interface ServiceWorkerGlobalScopeLike {
  addEventListener(
    type: "install" | "activate" | "fetch" | "sync" | string,
    listener: (ev: any) => void
  ): void;
  skipWaiting(): Promise<void>;
  clients: {
    claim(): Promise<void>;
  };
  registration: {
    navigationPreload?: {
      enable(): Promise<void>;
    };
    sync?: {
      register(tag: string): Promise<void>;
    };
  };
}

const swScope: ServiceWorkerGlobalScopeLike | undefined =
  typeof self !== "undefined" && "skipWaiting" in self
    ? (self as unknown as ServiceWorkerGlobalScopeLike)
    : undefined;

if (swScope) {
  // INSTALL: Pre-cache UI Shell
  swScope.addEventListener("install", (event: ExtendableEventLike) => {
    event.waitUntil(
      (async () => {
        const shellCache = await caches.open(CACHE_SHELL);
        await Promise.allSettled(
          PRECACHE_SHELL_URLS.map((url) =>
            shellCache.add(new Request(url, { cache: "reload" }))
          )
        );
        await swScope.skipWaiting();
      })()
    );
  });

  // ACTIVATE: Purge obsolete cache generations & claim clients
  swScope.addEventListener("activate", (event: ExtendableEventLike) => {
    event.waitUntil(
      (async () => {
        const validCaches = new Set([CACHE_SHELL, CACHE_MENUS, CACHE_ASSETS]);
        const existingNames = await caches.keys();
        await Promise.all(
          existingNames
            .filter((name) => !validCaches.has(name))
            .map((name) => caches.delete(name))
        );
        if (swScope.registration.navigationPreload) {
          await swScope.registration.navigationPreload.enable();
        }
        await swScope.clients.claim();
      })()
    );
  });

  // FETCH: Execute Strategy Matrix
  swScope.addEventListener("fetch", (event: FetchEventLike) => {
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
        event.respondWith(handleStaleWhileRevalidate(request, event));
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

  // BACKGROUND SYNC: Auto-replay mutations on network recovery
  swScope.addEventListener("sync", (event: SyncEventLike) => {
    if (event.tag === SYNC_TAG) {
      event.waitUntil(flushOfflineMutations());
    }
  });
}