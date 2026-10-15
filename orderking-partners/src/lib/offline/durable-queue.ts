import { openDB } from "idb";

const DB_NAME = "orderking-partners-queue";
const STORE_NAME = "mutations";
const DLQ_STORE_NAME = "dead_letters";
const MAX_RETRIES = 7;

// In-memory fallback for environments without global indexedDB (Node.js SSR / tests)
const memoryStorage = new Map<string, Map<string, any>>([
  [STORE_NAME, new Map<string, any>()],
  [DLQ_STORE_NAME, new Map<string, any>()],
]);

function getMemoryStore(name: string) {
  if (!memoryStorage.has(name)) {
    memoryStorage.set(name, new Map<string, any>());
  }
  return memoryStorage.get(name)!;
}

export async function initQueueDB(): Promise<any> {
  if (typeof indexedDB === "undefined") {
    return {
      transaction: (stores: string | string[]) => {
        return {
          objectStore: (name: string) => {
            const mem = getMemoryStore(name);
            return {
              get: async (key: string) => mem.get(key),
              getAll: async () => Array.from(mem.values()),
              put: async (val: any) => {
                mem.set(val.id, val);
                return val.id;
              },
              delete: async (key: string) => {
                mem.delete(key);
              },
              count: async () => mem.size,
              clear: async () => {
                mem.clear();
              },
            };
          },
        };
      },
      put: async (storeName: string, val: any) => {
        getMemoryStore(storeName).set(val.id, val);
        return val.id;
      },
      delete: async (storeName: string, key: string) => {
        getMemoryStore(storeName).delete(key);
      },
      count: async (storeName: string) => getMemoryStore(storeName).size,
    };
  }

  return openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DLQ_STORE_NAME)) {
        db.createObjectStore(DLQ_STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export type QueueItem = {
  id: string;
  action: "accept" | "reject" | "preparing" | "ready";
  orderId: string;
  restaurantId: string;
  reason?: string;
  idempotencyKey: string;
  timestamp: number;
  retryCount?: number;
  nextRetryAt?: number;
  error?: string;
};

export async function enqueueMutation(
  item: Omit<QueueItem, "id" | "timestamp" | "retryCount" | "nextRetryAt">,
) {
  const db = await initQueueDB();
  const id = crypto.randomUUID();
  const entry: QueueItem = {
    ...item,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    nextRetryAt: 0,
  };
  await db.put(STORE_NAME, entry);
  console.log(
    `[DurableQueue] Order ${item.orderId} transition to ${item.action} queued securely in IndexedDB (${id}).`,
  );

  // Register Background Sync if supported
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg: any) => {
        if ("sync" in reg) {
          reg.sync.register("sync-partner-orders").catch(() => {});
        }
      })
      .catch(() => {});
  }

  // Attempt flush immediately if online
  if (typeof navigator !== "undefined" && navigator.onLine && registeredTransitionFn) {
    void flushQueue(registeredTransitionFn);
  }
}

export async function getQueueStats(): Promise<{ pendingCount: number; dlqCount: number }> {
  try {
    const db = await initQueueDB();
    const pendingCount = await db.count(STORE_NAME);
    const dlqCount = await db.count(DLQ_STORE_NAME);
    return { pendingCount, dlqCount };
  } catch {
    return { pendingCount: 0, dlqCount: 0 };
  }
}

let registeredTransitionFn: ((data: any) => Promise<any>) | null = null;

export function registerDefaultTransitionFn(fn: (data: any) => Promise<any>) {
  registeredTransitionFn = fn;
}

export async function flushQueue(transitionFn?: (data: any) => Promise<any>) {
  const fn = transitionFn ?? registeredTransitionFn;
  if (!fn) return;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return;
  }

  const db = await initQueueDB();
  const tx = db.transaction([STORE_NAME, DLQ_STORE_NAME], "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const dlqStore = tx.objectStore(DLQ_STORE_NAME);
  const allItems: QueueItem[] = await store.getAll();

  if (allItems.length === 0) return;

  const now = Date.now();
  // Filter for items ready for retry and sort FIFO by timestamp
  const items = allItems
    .filter((item) => (item.nextRetryAt ?? 0) <= now)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (items.length === 0) return;

  console.log(`[DurableQueue] Flushing ${items.length} queued order transitions...`);

  for (const item of items) {
    try {
      await fn({
        data: {
          restaurantId: item.restaurantId,
          orderId: item.orderId,
          action: item.action,
          reason: item.reason,
          idempotencyKey: item.idempotencyKey,
        },
      });

      console.log(`[DurableQueue] Successfully flushed mutation ${item.id}`);
      await store.delete(item.id);
    } catch (e: any) {
      console.error(`[DurableQueue] Error flushing mutation ${item.id}`, e);

      const currentRetries = (item.retryCount ?? 0) + 1;
      const isClientError =
        e?.status >= 400 && e?.status < 500 && e?.status !== 408 && e?.status !== 429;

      if (currentRetries > MAX_RETRIES || isClientError) {
        console.warn(`[DurableQueue] Moving unretryable mutation ${item.id} to Dead Letter Queue (DLQ)`);
        await dlqStore.put({
          ...item,
          retryCount: currentRetries,
          failedAt: Date.now(),
          finalError: String(e?.message || e),
        });
        await store.delete(item.id);
      } else {
        const baseDelayMs = 2000;
        const maxDelayMs = 60000 * 3;
        const expDelay = Math.min(baseDelayMs * Math.pow(2, currentRetries), maxDelayMs);
        const jitter = Math.floor(Math.random() * expDelay * 0.25);
        item.retryCount = currentRetries;
        item.nextRetryAt = Date.now() + expDelay + jitter;
        item.error = String(e?.message || e);
        await store.put(item);
      }

      // Stop loop if it was a network drop
      if (
        e instanceof TypeError ||
        String(e?.message || e).includes("fetch") ||
        String(e?.message || e).includes("Network")
      ) {
        break;
      }
    }
  }
}

// Global listener for online event & Service Worker message
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[DurableQueue] Network restored. Event fired. Engaging instant queue sync.");
    if (registeredTransitionFn) {
      void flushQueue(registeredTransitionFn);
    }
  });

  // Background retry heartbeat every 30 seconds
  setInterval(() => {
    if (navigator.onLine && registeredTransitionFn) {
      void flushQueue(registeredTransitionFn);
    }
  }, 30000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "ORDERKING_SYNC_TRIGGER" && registeredTransitionFn) {
        console.log("[DurableQueue] Received sync trigger from Service Worker.");
        void flushQueue(registeredTransitionFn);
      }
    });
  }
}
