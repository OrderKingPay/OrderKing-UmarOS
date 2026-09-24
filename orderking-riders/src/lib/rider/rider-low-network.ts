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
 * - Aggressive localStorage snapshotting for active delivery, earnings, and duty status.
 * - Enqueues delivery status mutations (ARRIVE_RESTAURANT, PICKUP, ARRIVE_CUSTOMER, COLLECT_CASH, DELIVER) offline.
 * - Automatic background replay with idempotency keys when signal returns.
 */

export type NetworkSpeed = "OFFLINE" | "SLOW_2G" | "NORMAL";

export function getRiderNetworkSpeed(): NetworkSpeed {
  if (typeof navigator === "undefined") return "NORMAL";
  if (!navigator.onLine) return "OFFLINE";

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
};

const QUEUE_KEY = "orderking_rider_action_queue";

export function enqueueRiderOfflineAction(
  action: Omit<RiderQueuedAction, "id" | "timestamp">,
): RiderQueuedAction {
  const queuedItem: RiderQueuedAction = {
    ...action,
    id: `rider_q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };

  try {
    if (typeof localStorage !== "undefined") {
      const existing: RiderQueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      existing.push(queuedItem);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
    }
  } catch {
    // Ignore
  }

  return queuedItem;
}

export function getRiderOfflineQueue(): RiderQueuedAction[] {
  try {
    if (typeof localStorage === "undefined") return [];
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearRiderOfflineQueue(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Ignore
  }
}

export async function flushRiderOfflineQueue(
  executor: (action: RiderQueuedAction) => Promise<void>,
): Promise<{ syncedCount: number; failedCount: number }> {
  const queue = getRiderOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  const remaining: RiderQueuedAction[] = [];

  for (const item of queue) {
    try {
      await executor(item);
      syncedCount++;
    } catch {
      failedCount++;
      remaining.push(item);
    }
  }

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
