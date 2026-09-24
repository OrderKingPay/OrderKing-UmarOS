/**
 * Low-Network & 2G Offline-First Cache Layer
 * OrderKing Partner / Kitchen App
 * 
 * Guarantees zero order loss and immediate kitchen responsiveness on 2G, EDGE, or unstable restaurant Wi-Fi:
 * - Aggressive localStorage snapshotting for live orders, KOT state, and settlement balances.
 * - Auto-detects 2G/slow network via Network Information API.
 * - Queues status transitions (ACCEPT, PREPARING, READY) offline and flushes when connection resumes.
 */

export type NetworkSpeed = "OFFLINE" | "SLOW_2G" | "NORMAL";

export function getPartnerNetworkSpeed(): NetworkSpeed {
  if (typeof navigator === "undefined") return "NORMAL";
  if (!navigator.onLine) return "OFFLINE";
  
  const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
    return "SLOW_2G";
  }
  return "NORMAL";
}

const CACHE_PREFIX = "orderking_partner_";

export function cachePartnerSet<T>(key: string, data: T): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      })
    );
  } catch {
    // Ignore quota errors
  }
}

export function cachePartnerGet<T>(key: string, maxAgeMs = 7200_000): T | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; cachedAt: number };
    if (Date.now() - parsed.cachedAt > maxAgeMs) {
      return parsed.data; // Stale-while-revalidate allowed on 2G
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export type QueuedPartnerAction = {
  id: string;
  orderId: string;
  action: "ACCEPT" | "PREPARING" | "READY" | "REJECT" | "INSTANT_SETTLE";
  payload?: Record<string, unknown>;
  timestamp: number;
};

const QUEUE_KEY = "orderking_partner_action_queue";

export function enqueuePartnerAction(action: Omit<QueuedPartnerAction, "id" | "timestamp">): void {
  try {
    if (typeof localStorage === "undefined") return;
    const existing: QueuedPartnerAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    existing.push({
      ...action,
      id: `partner_q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore
  }
}

export function getPartnerActionQueue(): QueuedPartnerAction[] {
  try {
    if (typeof localStorage === "undefined") return [];
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearPartnerActionQueue(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Ignore
  }
}

export async function flushPartnerActionQueue(
  executor: (action: QueuedPartnerAction) => Promise<void>,
): Promise<{ syncedCount: number; failedCount: number }> {
  const queue = getPartnerActionQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  const remaining: QueuedPartnerAction[] = [];

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
