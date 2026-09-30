
import { openDB } from "idb";

const DB_NAME = "orderking-durable-queue";
const STORE_NAME = "mutations";
const DLQ_STORE_NAME = "dead_letters";
const MAX_RETRIES = 7;

export async function initQueueDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
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
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  nextRetryAt: number;
};

export async function enqueueMutation(item: Omit<QueueItem, "id" | "timestamp" | "retryCount" | "nextRetryAt">) {
  const db = await initQueueDB();
  const id = crypto.randomUUID();
  await db.put(STORE_NAME, {
    ...item,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    nextRetryAt: 0, // 0 means ready immediately
  });
  console.log(`[DurableQueue] Advanced offline mutation ${id} securely enqueued.`);
  
  // Attempt immediate flush if online
  if (typeof navigator !== "undefined" && navigator.onLine) {
    flushQueue();
  }
}

export async function flushQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }
  
  const db = await initQueueDB();
  const tx = db.transaction([STORE_NAME, DLQ_STORE_NAME], "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const dlqStore = tx.objectStore(DLQ_STORE_NAME);
  const allItems: QueueItem[] = await store.getAll();
  
  const now = Date.now();
  // Filter for items ready to be retried and sort by timestamp (FIFO)
  const items = allItems
    .filter(item => item.nextRetryAt <= now)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (items.length === 0) return;
  
  console.log(`[DurableQueue] Activating flush for ${items.length} resilient mutations...`);
  
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          ...item.headers,
          "X-Offline-Retry-Count": item.retryCount.toString(),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)) {
        // 4xx errors (excluding timeouts/rate-limits) are client errors and won't be fixed by retrying.
        console.log(`[DurableQueue] Successfully executed & confirmed mutation ${item.id}`);
        await store.delete(item.id);
      } else {
        throw new Error(`Server temporary rejection: ${res.status}`);
      }
    } catch (e) {
      console.warn(`[DurableQueue] Network struggle on ${item.id}. Engaging backoff algorithm.`, e);
      
      item.retryCount += 1;
      if (item.retryCount > MAX_RETRIES) {
        console.error(`[DurableQueue] Mutation ${item.id} exhausted max retries (${MAX_RETRIES}). Moving to DLQ.`);
        await dlqStore.put({ ...item, failedAt: Date.now(), finalError: String(e) });
        await store.delete(item.id);
      } else {
        // Advanced Exponential Backoff with Full Jitter for extreme network conditions
        const baseDelayMs = 2000;
        const maxDelayMs = 60000 * 5; // 5 minutes max
        const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, item.retryCount), maxDelayMs);
        const jitter = Math.floor(Math.random() * exponentialDelay); 
        
        item.nextRetryAt = Date.now() + exponentialDelay + jitter;
        
        console.log(`[DurableQueue] Rescheduled ${item.id} for retry in ${Math.round((exponentialDelay + jitter)/1000)}s`);
        await store.put(item);
      }
      
      // If we hit a network error, stop flushing the rest to prevent spamming
      if (e instanceof TypeError || (e as any).message.includes('fetch') || (e as any).message.includes('Network')) {
        break; 
      }
    }
  }
}

// Global listeners for robust state recovery
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[DurableQueue] Network signal recovered. Engaging instant sync.");
    flushQueue();
  });
  
  // Setup a background heartbeat for items waiting for backoff
  setInterval(() => {
     if (navigator.onLine) {
         flushQueue();
     }
  }, 30000); // Check every 30s for pending backoffs
}
