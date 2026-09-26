import { openDB } from "idb";

const DB_NAME = "orderking-durable-queue";
const STORE_NAME = "mutations";

export async function initQueueDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
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
};

export async function enqueueMutation(item: Omit<QueueItem, "id" | "timestamp">) {
  const db = await initQueueDB();
  const id = crypto.randomUUID();
  await db.put(STORE_NAME, {
    ...item,
    id,
    timestamp: Date.now(),
  });
  console.log(`[DurableQueue] Mutation ${id} queued securely in IndexedDB.`);
}

export async function flushQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }
  
  const db = await initQueueDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const items: QueueItem[] = await store.getAll();
  
  if (items.length === 0) return;
  
  console.log(`[DurableQueue] Flushing ${items.length} queued mutations...`);
  
  // Sort by timestamp to ensure FIFO
  items.sort((a, b) => a.timestamp - b.timestamp);

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      
      if (res.ok) {
        console.log(`[DurableQueue] Successfully flushed mutation ${item.id}`);
        await db.delete(STORE_NAME, item.id);
      } else {
        console.warn(`[DurableQueue] Failed to flush mutation ${item.id}, server responded with ${res.status}`);
        // Implement exponential backoff or DLQ logic later if needed
      }
    } catch (e) {
      console.error(`[DurableQueue] Network error flushing mutation ${item.id}`, e);
      break; // Stop flushing if offline again
    }
  }
}

// Global listener for online event
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[DurableQueue] Network restored. Instantly flushing queue.");
    flushQueue();
  });
}
