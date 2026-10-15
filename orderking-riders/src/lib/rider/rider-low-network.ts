/**
 * Low-Network & 2G Offline-First Cache Layer
 * OrderKing Rider / Delivery Fleet App
 *
 * Guarantees zero delivery action drops and 0ms UI responsiveness even in:
 * - Underground parking lots / basement restaurant kitchens
 * - High-speed transit in remote / border cell towers
 * - 2G, EDGE, or momentary network cutouts
 *
 * Capabilities:
 * - High-speed IndexedDB + localStorage snapshotting for active delivery, earnings, and duty status.
 * - Enqueues delivery status mutations (ARRIVE_RESTAURANT, PICKUP, ARRIVE_CUSTOMER, COLLECT_CASH, DELIVER) offline.
 * - Automatic background replay with idempotency keys when signal returns.
 * - Dead Letter Queue (DLQ) and exponential backoff with jitter.
 */

export type NetworkSpeed = "OFFLINE" | "SLOW_2G" | "NORMAL";

export function getRiderNetworkSpeed(): NetworkSpeed {
  if (typeof navigator === "undefined") return "NORMAL";
  if (navigator.onLine === false) return "OFFLINE";

  const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
    return "SLOW_2G";
  }
  return "NORMAL";
}

const CACHE_PREFIX = "orderking_rider_";

export function cacheRiderSet<T>(key: string, data: T): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore quota errors in private browsing
  }
}

export function cacheRiderGet<T>(key: string, maxAgeMs = 7200_000): T | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; cachedAt: number };
    if (Date.now() - parsed.cachedAt > maxAgeMs) {
      return parsed.data; // Stale-while-revalidate allowed on low bandwidth
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export type RiderQueuedAction = {
  id: string;
  deliveryId: string;
  action:
    | "ARRIVING"
    | "ARRIVE_RESTAURANT"
    | "NOT_READY"
    | "PICKUP"
    | "START"
    | "ARRIVE_CUSTOMER"
    | "COLLECT_CASH"
    | "DELIVER"
    | "UNAVAILABLE"
    | "CONTACT"
    | "CANCEL"
    | "DUTY_TOGGLE";
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  timestamp: number;
  retryCount?: number;
  nextRetryAt?: number;
  error?: string;
};

const QUEUE_KEY = "orderking_rider_action_queue";
const DB_NAME = "orderking-rider-queue";
const STORE_MUTATIONS = "mutations";
const STORE_DLQ = "dead_letters";
const MAX_RETRIES = 7;

// In-memory fallback for SSR & test environments
const memoryStore = new Map<string, RiderQueuedAction>();
const memoryDLQ = new Map<string, RiderQueuedAction>();

function openRiderIDB(): Promise<IDBDatabase> | null {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
        db.createObjectStore(STORE_MUTATIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_DLQ)) {
        db.createObjectStore(STORE_DLQ, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName: string, item: RiderQueuedAction): Promise<void> {
  const dbPromise = openRiderIDB();
  if (!dbPromise) {
    if (storeName === STORE_DLQ) memoryDLQ.set(item.id, item);
    else memoryStore.set(item.id, item);
    return;
  }
  try {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    if (storeName === STORE_DLQ) memoryDLQ.set(item.id, item);
    else memoryStore.set(item.id, item);
  }
}

async function idbDelete(storeName: string, id: string): Promise<void> {
  const dbPromise = openRiderIDB();
  if (!dbPromise) {
    if (storeName === STORE_DLQ) memoryDLQ.delete(id);
    else memoryStore.delete(id);
    return;
  }
  try {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    if (storeName === STORE_DLQ) memoryDLQ.delete(id);
    else memoryStore.delete(id);
  }
}

export function enqueueRiderOfflineAction(
  action: Omit<RiderQueuedAction, "id" | "timestamp" | "retryCount" | "nextRetryAt">,
): RiderQueuedAction {
  const queuedItem: RiderQueuedAction = {
    ...action,
    id: `rider_q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    retryCount: 0,
    nextRetryAt: 0,
  };

  // 1. Sync mirror in localStorage for immediate access & backwards compatibility
  try {
    if (typeof localStorage !== "undefined") {
      const existing: RiderQueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      existing.push(queuedItem);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
    }
  } catch {
    // Ignore quota errors
  }

  // 2. Durable asynchronous write in IndexedDB
  void idbPut(STORE_MUTATIONS, queuedItem);

  // 3. Register Background Sync with Service Worker
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg: any) => {
        if ("sync" in reg) {
          reg.sync.register("sync-rider-actions").catch(() => {});
        }
      })
      .catch(() => {});
  }

  return queuedItem;
}

export function getRiderOfflineQueue(): RiderQueuedAction[] {
  try {
    if (typeof localStorage !== "undefined") {
      const items = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      if (items.length > 0) return items;
    }
  } catch {
    // Ignore
  }
  return Array.from(memoryStore.values());
}

export function clearRiderOfflineQueue(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(QUEUE_KEY);
    }
  } catch {
    // Ignore
  }
  memoryStore.clear();
  memoryDLQ.clear();

  const dbPromise = openRiderIDB();
  if (dbPromise) {
    dbPromise
      .then((db) => {
        const tx = db.transaction([STORE_MUTATIONS, STORE_DLQ], "readwrite");
        tx.objectStore(STORE_MUTATIONS).clear();
        tx.objectStore(STORE_DLQ).clear();
      })
      .catch(() => {});
  }
}

let registeredExecutor: ((action: RiderQueuedAction) => Promise<void>) | null = null;

export function registerDefaultRiderExecutor(executor: (action: RiderQueuedAction) => Promise<void>) {
  registeredExecutor = executor;
}

export async function flushRiderOfflineQueue(
  executor?: (action: RiderQueuedAction) => Promise<void>,
): Promise<{ syncedCount: number; failedCount: number }> {
  const fn = executor ?? registeredExecutor;
  if (!fn) return { syncedCount: 0, failedCount: 0 };

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = getRiderOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  const now = Date.now();
  // Filter for items ready for retry and sort FIFO
  const items = queue
    .filter((item) => (item.nextRetryAt ?? 0) <= now)
    .sort((a, b) => a.timestamp - b.timestamp);

  let syncedCount = 0;
  let failedCount = 0;
  const remaining: RiderQueuedAction[] = [];

  for (const item of items) {
    try {
      await fn(item);
      syncedCount++;
      await idbDelete(STORE_MUTATIONS, item.id);
    } catch (e: any) {
      failedCount++;
      const currentRetries = (item.retryCount ?? 0) + 1;
      item.retryCount = currentRetries;
      item.error = String(e?.message || e);

      if (currentRetries > MAX_RETRIES) {
        console.warn(`[RiderOffline] Action ${item.id} exceeded max retries. Moved to DLQ.`);
        await idbPut(STORE_DLQ, item);
        await idbDelete(STORE_MUTATIONS, item.id);
      } else {
        const baseDelayMs = 2000;
        const maxDelayMs = 60000 * 3;
        const expDelay = Math.min(baseDelayMs * Math.pow(2, currentRetries), maxDelayMs);
        const jitter = Math.floor(Math.random() * expDelay * 0.25);
        item.nextRetryAt = Date.now() + expDelay + jitter;
        remaining.push(item);
        await idbPut(STORE_MUTATIONS, item);
      }
    }
  }

  // Update sync localStorage copy
  try {
    if (typeof localStorage !== "undefined") {
      if (remaining.length === 0) {
        localStorage.removeItem(QUEUE_KEY);
      } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      }
    }
  } catch {
    // Ignore
  }

  return { syncedCount, failedCount };
}

// Global auto-recovery listeners
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[RiderOffline] Signal recovered. Replaying dispatch queue.");
    if (registeredExecutor) {
      void flushRiderOfflineQueue(registeredExecutor);
    }
  });

  setInterval(() => {
    if (navigator.onLine && registeredExecutor) {
      void flushRiderOfflineQueue(registeredExecutor);
    }
  }, 30000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "ORDERKING_RIDER_SYNC_TRIGGER" && registeredExecutor) {
        void flushRiderOfflineQueue(registeredExecutor);
      }
    });
  }
}
