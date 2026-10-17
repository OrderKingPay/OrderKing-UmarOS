import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SW_VERSION,
  CACHE_SHELL,
  CACHE_MENUS,
  CACHE_ASSETS,
  IDB_NAME,
  IDB_STORE,
  SYNC_TAG,
  NETWORK_FIRST_TIMEOUT_MS,
  PRECACHE_SHELL_URLS,
  EMERGENCY_OFFLINE_HTML,
  selectRouteStrategy,
  handleNetworkFirstNavigation,
  handleShellCacheOnly,
  handleStaleWhileRevalidate,
  handleNetworkFirstCheckoutAndOps,
  handleImmutableAssetCache,
  openOutboxDb,
  enqueueOfflineMutation,
  getQueuedOfflineMutations,
  deleteOfflineMutation,
  clearOfflineOutbox,
  flushOfflineMutations,
  fetchWithTimeout,
  type QueuedOfflineMutation,
} from "../sw.ts";

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY CACHE MOCK FOR TESTING
// ─────────────────────────────────────────────────────────────────────────────
class MockCache implements Cache {
  private store = new Map<string, Response>();

  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    const key =
      typeof request === "string"
        ? request
        : request instanceof Request
        ? request.url
        : request.toString();
    const hit = this.store.get(key);
    return hit ? hit.clone() : undefined;
  }

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const key =
      typeof request === "string"
        ? request
        : request instanceof Request
        ? request.url
        : request.toString();
    this.store.set(key, response.clone());
  }

  async delete(request: RequestInfo | URL): Promise<boolean> {
    const key =
      typeof request === "string"
        ? request
        : request instanceof Request
        ? request.url
        : request.toString();
    return this.store.delete(key);
  }

  async add(): Promise<void> {}
  async addAll(): Promise<void> {}
  async matchAll(): Promise<Response[]> {
    return Array.from(this.store.values()).map((r) => r.clone());
  }
  async keys(): Promise<Request[]> {
    return Array.from(this.store.keys()).map((k) => new Request(k));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY INDEXEDDB MOCK FOR TESTING
// ─────────────────────────────────────────────────────────────────────────────
class MockIDBFactory implements IDBFactory {
  public databasesMap = new Map<string, Map<string, Map<any, any>>>();

  open(name: string, _version?: number): IDBOpenDBRequest {
    if (!this.databasesMap.has(name)) {
      this.databasesMap.set(name, new Map());
    }
    const dbStores = this.databasesMap.get(name)!;

    const mockDb: any = {
      name,
      version: 1,
      objectStoreNames: {
        contains: (storeName: string) => dbStores.has(storeName),
      },
      createObjectStore: (storeName: string, _options?: any) => {
        if (!dbStores.has(storeName)) {
          dbStores.set(storeName, new Map());
        }
        return {};
      },
      transaction: (storeNames: string | string[], _mode: string) => {
        const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
        const targetMap = dbStores.get(storeName) || new Map();
        if (!dbStores.has(storeName)) {
          dbStores.set(storeName, targetMap);
        }

        const tx: any = {
          objectStore: (_s: string) => ({
            put: (value: any) => {
              targetMap.set(value.id, value);
              const req: any = { result: value.id };
              setTimeout(() => {
                if (req.onsuccess) req.onsuccess({ target: req });
              }, 0);
              return req;
            },
            getAll: () => {
              const req: any = {};
              setTimeout(() => {
                req.result = Array.from(targetMap.values());
                if (req.onsuccess) req.onsuccess({ target: req });
              }, 0);
              return req;
            },
            delete: (id: any) => {
              targetMap.delete(id);
              const req: any = { result: undefined };
              setTimeout(() => {
                if (req.onsuccess) req.onsuccess({ target: req });
              }, 0);
              return req;
            },
            clear: () => {
              targetMap.clear();
              const req: any = { result: undefined };
              setTimeout(() => {
                if (req.onsuccess) req.onsuccess({ target: req });
              }, 0);
              return req;
            },
          }),
          oncomplete: null,
          onerror: null,
        };

        setTimeout(() => {
          if (tx.oncomplete) tx.oncomplete();
        }, 0);

        return tx;
      },
    };

    const req: any = {
      result: mockDb,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    setTimeout(() => {
      if (req.onupgradeneeded) {
        req.onupgradeneeded({ target: req });
      }
      if (req.onsuccess) {
        req.onsuccess({ target: req });
      }
    }, 0);

    return req as IDBOpenDBRequest;
  }

  deleteDatabase(): IDBOpenDBRequest {
    return {} as IDBOpenDBRequest;
  }
  cmp(): number {
    return 0;
  }
  databases(): Promise<IDBDatabaseInfo[]> {
    return Promise.resolve([]);
  }
}

describe("OrderKing Low-Network Service Worker & PWA Resilience Suite", () => {
  let mockIdb: MockIDBFactory;

  beforeEach(() => {
    mockIdb = new MockIDBFactory();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ROUTING STRATEGY SELECTION
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Routing Strategy Selection Matrix", () => {
    it("should bypass external Razorpay payment gateways and live streaming endpoints", () => {
      expect(
        selectRouteStrategy({ url: "https://api.razorpay.com/v1/orders" })
      ).toBe("bypass");
      expect(
        selectRouteStrategy({ url: "https://checkout.razorpay.com/v1/checkout.js" })
      ).toBe("bypass");
      expect(
        selectRouteStrategy({ url: "https://orderking.in/api/webhooks/delivery" })
      ).toBe("bypass");
      expect(
        selectRouteStrategy({ url: "https://orderking.in/api/sync/live-telemetry" })
      ).toBe("bypass");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/orders/stream",
          headers: { Accept: "text/event-stream" },
        })
      ).toBe("bypass");
    });

    it("should route SPA navigation requests to network-first-navigation", () => {
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/orders/ord_7718",
          mode: "navigate",
        })
      ).toBe("network-first-navigation");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/checkout",
          mode: "navigate",
        })
      ).toBe("network-first-navigation");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/r/karimganj-biryani",
          mode: "navigate",
        })
      ).toBe("network-first-navigation");
    });

    it("should route pre-cached UI shell assets to cache-shell when not navigating", () => {
      for (const precacheUrl of PRECACHE_SHELL_URLS) {
        expect(
          selectRouteStrategy({ url: `https://orderking.in${precacheUrl}` })
        ).toBe("cache-shell");
      }
    });

    it("should route restaurant menus, catalogs, and media assets to stale-while-revalidate", () => {
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/restaurants?lat=24.8&lng=92.3",
          method: "GET",
        })
      ).toBe("stale-while-revalidate");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/menu?restaurantId=rst_99",
          method: "GET",
        })
      ).toBe("stale-while-revalidate");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/cdn/dishes/dum-biryani.png",
          method: "GET",
        })
      ).toBe("stale-while-revalidate");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/images/store-cover.webp",
          method: "GET",
        })
      ).toBe("stale-while-revalidate");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/icons/badge.svg",
          method: "GET",
        })
      ).toBe("stale-while-revalidate");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/fonts/inter.woff2",
          method: "GET",
        })
      ).toBe("stale-while-revalidate");

      // Non-GET requests to menu endpoints must NOT use stale-while-revalidate
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/menu",
          method: "POST",
        })
      ).not.toBe("stale-while-revalidate");
    });

    it("should route checkout, payments, orders, and rider endpoints to network-first", () => {
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/checkout/quote",
          method: "POST",
        })
      ).toBe("network-first");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/razorpay/create-order",
          method: "POST",
        })
      ).toBe("network-first");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/orders/active",
          method: "GET",
        })
      ).toBe("network-first");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/rider/location",
          method: "PATCH",
        })
      ).toBe("network-first");
    });

    it("should route hashed Vite bundles to asset-cache-first", () => {
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/assets/index-Bf67a.js",
          method: "GET",
        })
      ).toBe("asset-cache-first");
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/assets/theme-d89e.css",
          method: "GET",
        })
      ).toBe("asset-cache-first");
    });

    it("should route unclassified endpoints to default", () => {
      expect(
        selectRouteStrategy({
          url: "https://orderking.in/api/analytics/track",
          method: "POST",
        })
      ).toBe("default");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. NETWORK-FIRST NAVIGATION & ZERO WHITE SCREEN GUARANTEE
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. Network-First Navigation & UI Shell Caching", () => {
    it("should fetch fresh network HTML and update /index.html in shell cache on fast network", async () => {
      const cache = new MockCache();
      const mockFetch = vi.fn().mockResolvedValue(
        new Response("<!DOCTYPE html><html>Live Truth Shell</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        })
      );

      const navReq = new Request("https://orderking.in/orders/ord_9999");
      const res = await handleNetworkFirstNavigation(navReq, cache, mockFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<!DOCTYPE html><html>Live Truth Shell</html>");
      expect(mockFetch).toHaveBeenCalledOnce();

      // Verify shellCache updated with /index.html
      const cached = await cache.match("/index.html");
      expect(cached).toBeDefined();
      expect(await cached!.text()).toBe("<!DOCTYPE html><html>Live Truth Shell</html>");
    });

    it("should fall back to cached shell when network request times out (>2500ms)", async () => {
      const cache = new MockCache();
      await cache.put(
        "/index.html",
        new Response("<!DOCTYPE html><html>Cached Shell Fallback</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        })
      );

      const mockTimeoutFetch = vi.fn().mockRejectedValue(
        new DOMException("The operation was aborted", "AbortError")
      );

      const navReq = new Request("https://orderking.in/checkout");
      const res = await handleNetworkFirstNavigation(navReq, cache, mockTimeoutFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<!DOCTYPE html><html>Cached Shell Fallback</html>");
    });

    it("should fall back to cached shell when network throws an error", async () => {
      const cache = new MockCache();
      await cache.put(
        "https://orderking.in/r/karimganj-biryani",
        new Response("<!DOCTYPE html><html>Exact URL Cached</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        })
      );

      const mockErrorFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      const navReq = new Request("https://orderking.in/r/karimganj-biryani");
      const res = await handleNetworkFirstNavigation(navReq, cache, mockErrorFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<!DOCTYPE html><html>Exact URL Cached</html>");
    });

    it("should serve EMERGENCY_OFFLINE_HTML guaranteeing zero white screen when network and cache both fail", async () => {
      const cache = new MockCache();
      const mockFailingFetch = vi.fn().mockRejectedValue(new Error("Cell tower unreachable"));

      const req = new Request("https://orderking.in/checkout");
      const res = await handleNetworkFirstNavigation(req, cache, mockFailingFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
      expect(res.headers.get("X-OrderKing-Offline")).toBe("emergency-shell");

      const html = await res.text();
      expect(html).toContain("Low Network Signal Detected");
      expect(html).toContain("Active cart & selections preserved");
      expect(html).toContain("Retry Connection");
      expect(html).toBe(EMERGENCY_OFFLINE_HTML);
    });

    it("should serve exact pre-cached shell assets from cache immediately via handleShellCacheOnly", async () => {
      const cache = new MockCache();
      const shellResponse = new Response("<html>Shell Index</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
      await cache.put("https://orderking.in/index.html", shellResponse);

      const req = new Request("https://orderking.in/index.html");
      const res = await handleShellCacheOnly(req, cache);

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toBe("<html>Shell Index</html>");
    });

    it("should serve EMERGENCY_OFFLINE_HTML via handleShellCacheOnly when cache and network both fail", async () => {
      const cache = new MockCache();
      const mockFailingFetch = vi.fn().mockRejectedValue(new Error("Cell tower unreachable"));

      const req = new Request("https://orderking.in/logo.jpg");
      const res = await handleShellCacheOnly(req, cache, mockFailingFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
      expect(res.headers.get("X-OrderKing-Offline")).toBe("emergency-shell");
      expect(await res.text()).toBe(EMERGENCY_OFFLINE_HTML);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. STALE-WHILE-REVALIDATE MENU & CATALOG CACHING
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Stale-While-Revalidate Engine (<15ms Local + Background Revalidation)", () => {
    it("should return cached catalog instantly and schedule background revalidation", async () => {
      const cache = new MockCache();
      const cachedMenu = { items: [{ id: "dish_1", name: "Kolkata Mutton Biryani", price: 340 }] };
      await cache.put(
        "https://orderking.in/api/menu?id=rest_1",
        new Response(JSON.stringify(cachedMenu), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      let waitPromise: Promise<unknown> | null = null;
      const mockEvent = {
        waitUntil: (p: Promise<unknown>) => {
          waitPromise = p;
        },
      };

      const freshMenu = { items: [{ id: "dish_1", name: "Kolkata Mutton Biryani", price: 350 }] };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(freshMenu), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const startTime = performance.now();
      const req = new Request("https://orderking.in/api/menu?id=rest_1");
      const res = await handleStaleWhileRevalidate(req, mockEvent, cache, mockFetch as unknown as typeof fetch);
      const elapsed = performance.now() - startTime;

      expect(elapsed).toBeLessThan(100); // Super fast local cache hit (<15ms typically)
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items[0].price).toBe(340); // Returned cached version immediately

      // Wait for background revalidation
      expect(mockEvent.waitUntil).toBeDefined();
      expect(waitPromise).not.toBeNull();
      await waitPromise;

      // Verify the cache was updated with the fresh network version
      const updatedCache = await cache.match(req);
      const updatedData = await updatedCache!.json();
      expect(updatedData.items[0].price).toBe(350);
    });

    it("should return fresh response when cache is empty and network is available", async () => {
      const cache = new MockCache();
      const freshMenu = { items: [{ id: "dish_2", name: "Paneer Butter Masala", price: 220 }] };
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(freshMenu), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const req = new Request("https://orderking.in/api/menu?id=rest_2");
      const res = await handleStaleWhileRevalidate(req, undefined, cache, mockFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items[0].name).toBe("Paneer Butter Masala");

      // Check it was cached
      const cached = await cache.match(req);
      expect(cached).toBeDefined();
    });

    it("should return OFFLINE-FALLBACK JSON catalog when cache is empty and network is down", async () => {
      const cache = new MockCache();
      const mockFailingFetch = vi.fn().mockRejectedValue(new Error("TCP connection reset"));

      const req = new Request("https://orderking.in/api/menu?id=rest_offline");
      const res = await handleStaleWhileRevalidate(req, undefined, cache, mockFailingFetch as unknown as typeof fetch);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-OrderKing-Cache")).toBe("OFFLINE-FALLBACK");
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.offline).toBe(true);
      expect(body.error).toContain("Menu temporarily offline");
      expect(body.items).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. NETWORK-FIRST WITH 6.5s TIMEOUT & OUTBOX CAPTURE
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Network-First Timeout (6.5s AbortController) & Outbox Capture", () => {
    it("should return fresh response when network responds under 6.5s", async () => {
      const cache = new MockCache();
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "active", orderId: "ord_101" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const req = new Request("https://orderking.in/api/orders/ord_101", { method: "GET" });
      const res = await handleNetworkFirstCheckoutAndOps(req, cache, mockFetch as unknown as typeof fetch, mockIdb);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.orderId).toBe("ord_101");

      // Verify GET orders response was cached for offline snapshot fallback
      const cached = await cache.match(req);
      expect(cached).toBeDefined();
    });

    it("should fall back to cached snapshot with X-OrderKing-Stale header on GET network timeout", async () => {
      const cache = new MockCache();
      const cachedSnapshot = new Response(JSON.stringify({ status: "PREPARING", orderId: "ord_102" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      await cache.put("https://orderking.in/api/orders/ord_102", cachedSnapshot);

      const mockTimeoutFetch = vi.fn().mockRejectedValue(new DOMException("The operation was aborted", "AbortError"));

      const req = new Request("https://orderking.in/api/orders/ord_102", { method: "GET" });
      const res = await handleNetworkFirstCheckoutAndOps(req, cache, mockTimeoutFetch as unknown as typeof fetch, mockIdb);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-OrderKing-Stale")).toBe("true");
      const json = await res.json();
      expect(json.status).toBe("PREPARING");
    });

    it("should return 503 on GET network failure if no cached snapshot exists", async () => {
      const cache = new MockCache();
      const mockTimeoutFetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const req = new Request("https://orderking.in/api/orders/ord_unseen", { method: "GET" });
      const res = await handleNetworkFirstCheckoutAndOps(req, cache, mockTimeoutFetch as unknown as typeof fetch, mockIdb);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.offline).toBe(true);
    });

    it("should NEVER queue payment transactions (/razorpay/) to prevent double charges", async () => {
      const cache = new MockCache();
      const mockFailingFetch = vi.fn().mockRejectedValue(new Error("3G cell drop"));

      const req = new Request("https://orderking.in/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: "pay_test", orderId: "order_test" }),
      });

      const res = await handleNetworkFirstCheckoutAndOps(req, cache, mockFailingFetch as unknown as typeof fetch, mockIdb);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.offline).toBe(true);
      expect(json.error).toContain("No money was deducted");

      // Verify nothing was queued in outbox
      const queued = await getQueuedOfflineMutations(mockIdb);
      expect(queued).toHaveLength(0);
    });

    it("should queue Rider/Partner status mutations in IndexedDB outbox and return 202 Accepted", async () => {
      const cache = new MockCache();
      const mockFailingFetch = vi.fn().mockRejectedValue(new Error("Half-open TCP blackhole"));

      const mutationBody = JSON.stringify({
        orderId: "ord_201",
        status: "PICKED_UP",
        riderId: "rider_55",
        lat: 24.86,
        lng: 92.35,
      });

      const req = new Request("https://orderking.in/api/rider/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer rider-secret-token",
        },
        body: mutationBody,
      });

      const res = await handleNetworkFirstCheckoutAndOps(req, cache, mockFailingFetch as unknown as typeof fetch, mockIdb);

      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.queuedOffline).toBe(true);
      expect(json.message).toContain("Saved to device outbox");

      // Verify item was stored in IndexedDB outbox
      const queued = await getQueuedOfflineMutations(mockIdb);
      expect(queued).toHaveLength(1);
      expect(queued[0].url).toBe("https://orderking.in/api/rider/status");
      expect(queued[0].method).toBe("POST");
      expect(queued[0].body).toBe(mutationBody);
      expect(queued[0].headers["authorization"]).toBe("Bearer rider-secret-token");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. INDEXEDDB OUTBOX & BACKGROUND SYNC REPLAY
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. IndexedDB Outbox & Background Sync Replay Flow", () => {
    it("should open outbox database and enforce schema with keyPath 'id'", async () => {
      const db = await openOutboxDb(mockIdb);
      expect(db.name).toBe(IDB_NAME);
      expect(db.objectStoreNames.contains(IDB_STORE)).toBe(true);
    });

    it("should enqueue, retrieve, delete, and clear mutations in outbox", async () => {
      const mut1: QueuedOfflineMutation = {
        id: "mut_test_1",
        url: "https://orderking.in/api/orders/ord_1/status",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
        queuedAt: 1000,
      };

      const mut2: QueuedOfflineMutation = {
        id: "mut_test_2",
        url: "https://orderking.in/api/rider/status",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
        queuedAt: 2000,
      };

      await enqueueOfflineMutation(mut1, mockIdb);
      await enqueueOfflineMutation(mut2, mockIdb);

      let list = await getQueuedOfflineMutations(mockIdb);
      expect(list).toHaveLength(2);

      await deleteOfflineMutation("mut_test_1", mockIdb);
      list = await getQueuedOfflineMutations(mockIdb);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe("mut_test_2");

      await clearOfflineOutbox(mockIdb);
      list = await getQueuedOfflineMutations(mockIdb);
      expect(list).toHaveLength(0);
    });

    it("should replay queued mutations in strict FIFO sequence with X-Idempotency-Key", async () => {
      const mut1: QueuedOfflineMutation = {
        id: "idemp_first",
        url: "https://orderking.in/api/orders/step1",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"step": 1}',
        queuedAt: 500, // Earlier
      };

      const mut2: QueuedOfflineMutation = {
        id: "idemp_second",
        url: "https://orderking.in/api/orders/step2",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"step": 2}',
        queuedAt: 800, // Later
      };

      // Enqueue out of order to verify sorting
      await enqueueOfflineMutation(mut2, mockIdb);
      await enqueueOfflineMutation(mut1, mockIdb);

      const callHistory: Array<{ url: string; headers: any }> = [];
      const mockFetch = vi.fn().mockImplementation((url: string, init: RequestInit) => {
        callHistory.push({ url, headers: init.headers });
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      });

      const replayResult = await flushOfflineMutations(mockIdb, mockFetch as unknown as typeof fetch);

      expect(replayResult.processed).toBe(2);
      expect(replayResult.succeeded).toBe(2);
      expect(replayResult.failed).toBe(0);

      // Verify FIFO execution order
      expect(callHistory[0].url).toBe("https://orderking.in/api/orders/step1");
      expect(callHistory[0].headers["X-Idempotency-Key"]).toBe("idemp_first");

      expect(callHistory[1].url).toBe("https://orderking.in/api/orders/step2");
      expect(callHistory[1].headers["X-Idempotency-Key"]).toBe("idemp_second");

      // Verify outbox was emptied
      const remaining = await getQueuedOfflineMutations(mockIdb);
      expect(remaining).toHaveLength(0);
    });

    it("should delete permanent client errors (4xx) so queue does not get poisoned", async () => {
      const badMutation: QueuedOfflineMutation = {
        id: "idemp_bad_req",
        url: "https://orderking.in/api/orders/invalid",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"invalid": true}',
        queuedAt: 100,
      };

      await enqueueOfflineMutation(badMutation, mockIdb);

      const mockFetch400 = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid schema" }), { status: 400 })
      );

      const res = await flushOfflineMutations(mockIdb, mockFetch400 as unknown as typeof fetch);
      expect(res.processed).toBe(1);
      expect(res.succeeded).toBe(1); // 4xx considered resolved/discarded

      const remaining = await getQueuedOfflineMutations(mockIdb);
      expect(remaining).toHaveLength(0);
    });

    it("should halt replay on network failure or 5xx server error, preserving remaining queue", async () => {
      const mut1: QueuedOfflineMutation = {
        id: "mut_server_err",
        url: "https://orderking.in/api/orders/500",
        method: "POST",
        headers: {},
        body: '{"test": 1}',
        queuedAt: 100,
      };

      const mut2: QueuedOfflineMutation = {
        id: "mut_pending_after",
        url: "https://orderking.in/api/orders/later",
        method: "POST",
        headers: {},
        body: '{"test": 2}',
        queuedAt: 200,
      };

      await enqueueOfflineMutation(mut1, mockIdb);
      await enqueueOfflineMutation(mut2, mockIdb);

      const mockFetch500 = vi.fn().mockResolvedValue(
        new Response("Server Error", { status: 500 })
      );

      const result = await flushOfflineMutations(mockIdb, mockFetch500 as unknown as typeof fetch);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.succeeded).toBe(0);

      // Both mutations must still remain in the queue
      const remaining = await getQueuedOfflineMutations(mockIdb);
      expect(remaining).toHaveLength(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. ASSET CACHING & CONSTANTS INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  describe("6. Asset Caching & Configuration Invariants", () => {
    it("should cache and serve immutable hashed assets", async () => {
      const cache = new MockCache();
      const assetReq = new Request("https://orderking.in/assets/vendor-ab12.js");
      const mockFetch = vi.fn().mockResolvedValue(
        new Response("console.log('vendor code');", { status: 200 })
      );

      const res = await handleImmutableAssetCache(assetReq, cache, mockFetch as unknown as typeof fetch);
      expect(res.status).toBe(200);

      const cached = await cache.match(assetReq);
      expect(cached).toBeDefined();

      // Subsequent call hits cache without fetching
      const cachedRes = await handleImmutableAssetCache(assetReq, cache, mockFetch as unknown as typeof fetch);
      expect(cachedRes.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("should uphold all resilience constants according to architectural specifications", () => {
      expect(SW_VERSION).toBe("orderking-v5.3.0-live-truth");
      expect(CACHE_SHELL).toBe("ok-shell-orderking-v5.3.0-live-truth");
      expect(CACHE_MENUS).toBe("ok-menus-orderking-v5.3.0-live-truth");
      expect(CACHE_ASSETS).toBe("ok-assets-orderking-v5.3.0-live-truth");
      expect(IDB_NAME).toBe("orderking-offline-outbox");
      expect(IDB_STORE).toBe("queued_mutations");
      expect(SYNC_TAG).toBe("sync-orderking-mutations");
      expect(NETWORK_FIRST_TIMEOUT_MS).toBe(6500);
      expect(PRECACHE_SHELL_URLS).toEqual([
        "/",
        "/index.html",
        "/manifest.json",
        "/logo.jpg",
      ]);
    });
  });
});
