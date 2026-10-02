import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "orderking-durable-queue";
const STORE_NAME = "mutations";
const DLQ_STORE_NAME = "dead_letters";
const MAX_RETRIES = 7;

type QueueDatabase = IDBPDatabase<unknown>;

export async function initQueueDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DLQ_STORE_NAME)) {
        db.createObjectStore(DLQ_STORE_NAME, { keyPath: "id" });
      }
    },
  }) as Promise<QueueDatabase>;
}

export type QueueItem = {
  id: string;
  url: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  nextRetryAt: number;
};

type DeadLetterItem = QueueItem & {
  failedAt: number;
  finalError: string;
};

let flushing = false;

export async function enqueueMutation(
  item: Omit<QueueItem, "id" | "timestamp" | "retryCount" | "nextRetryAt">,
) {
  const db = await initQueueDB();
  const id = crypto.randomUUID();

  await db.put(STORE_NAME, {
    ...item,
    id,
    timestamp: Date.now(),
    retryCount: 0,
    nextRetryAt: 0,
  });

  // A queued mutation is only "queued locally". It is NOT a successful server action.
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushQueue();
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

async function moveToDeadLetter(
  db: QueueDatabase,
  item: QueueItem,
  reason: string,
) {
  const dlqItem: DeadLetterItem = {
    ...item,
    failedAt: Date.now(),
    finalError: reason,
  };
  await db.put(DLQ_STORE_NAME, dlqItem);
  await db.delete(STORE_NAME, item.id);
}

export async function flushQueue() {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  flushing = true;
  try {
    const db = await initQueueDB();
    const allItems = (await db.getAll(STORE_NAME)) as QueueItem[];
    const now = Date.now();

    const items = allItems
      .filter((item) => item.nextRetryAt <= now)
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            ...item.headers,
            "X-Offline-Retry-Count": String(item.retryCount),
          },
          body: item.body === undefined ? undefined : JSON.stringify(item.body),
        });

        if (response.ok) {
          // Only an actual 2xx HTTP response is treated as server confirmation.
          await db.delete(STORE_NAME, item.id);
          continue;
        }

        if (!isRetryableStatus(response.status)) {
          // 4xx errors (including auth/validation) are not successful execution.
          // Preserve them for audit/review instead of silently deleting them.
          const message = `Permanent mutation rejection: HTTP ${response.status}`;
          await moveToDeadLetter(db, item, message);
          continue;
        }

        throw new Error(`Temporary server rejection: HTTP ${response.status}`);
      } catch (error) {
        item.retryCount += 1;

        if (item.retryCount > MAX_RETRIES) {
          await moveToDeadLetter(
            db,
            item,
            error instanceof Error ? error.message : String(error),
          );
          continue;
        }

        const baseDelayMs = 2_000;
        const maxDelayMs = 5 * 60_000;
        const exponentialDelay = Math.min(
          baseDelayMs * 2 ** item.retryCount,
          maxDelayMs,
        );
        const jitter = Math.floor(Math.random() * exponentialDelay);
        item.nextRetryAt = Date.now() + exponentialDelay + jitter;

        await db.put(STORE_NAME, item);

        // A network failure should stop this pass; another online event/heartbeat
        // can retry later without hammering a degraded connection.
        if (
          error instanceof TypeError ||
          /network|fetch|failed to fetch/i.test(
            error instanceof Error ? error.message : String(error),
          )
        ) {
          break;
        }
      }
    }
  } finally {
    flushing = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushQueue();
  });

  setInterval(() => {
    if (navigator.onLine) void flushQueue();
  }, 30_000);
}
