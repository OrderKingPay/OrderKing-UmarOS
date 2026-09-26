import { openDB } from "idb";

const DB_NAME = "orderking-partners-queue";
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
  action: "accept" | "reject" | "preparing" | "ready";
  orderId: string;
  restaurantId: string;
  reason?: string;
  idempotencyKey: string;
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
  console.log(`[DurableQueue] Order ${item.orderId} transition to ${item.action} queued securely in IndexedDB.`);
}

export async function flushQueue(transitionFn: (data: any) => Promise<any>) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }
  
  const db = await initQueueDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const items: QueueItem[] = await store.getAll();
  
  if (items.length === 0) return;
  
  console.log(`[DurableQueue] Flushing ${items.length} queued order transitions...`);
  
  // Sort by timestamp to ensure FIFO
  items.sort((a, b) => a.timestamp - b.timestamp);

  for (const item of items) {
    try {
      await transitionFn({
        data: {
          restaurantId: item.restaurantId,
          orderId: item.orderId,
          action: item.action,
          reason: item.reason,
          idempotencyKey: item.idempotencyKey,
        }
      });
      
      console.log(`[DurableQueue] Successfully flushed mutation ${item.id}`);
      await db.delete(STORE_NAME, item.id);
    } catch (e) {
      console.error(`[DurableQueue] Error flushing mutation ${item.id}`, e);
      // Wait for next network available to retry or break if network error
      break; 
    }
  }
}

// Global listener for online event
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[DurableQueue] Network restored. Event fired. Please ensure flushQueue is called with the function.");
  });
}
