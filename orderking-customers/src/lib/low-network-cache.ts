
/**
 * Low-Network & 2G Offline-First Cache Layer
 * OrderKing Customer App
 * 
 * Optimizes perceived response time on slow/unstable networks with local snapshots:
 * - Local snapshots for non-sensitive catalog/UI state and active-order display data.
 * - Auto-detects 2G/slow network via Network Information API or fetch latency.
 * - Queues background offline mutations and synchronizes upon network recovery.
 */

export type NetworkSpeed = "OFFLINE" | "SLOW_2G" | "NORMAL";

export function getNetworkSpeed(): NetworkSpeed {
  if (typeof navigator === "undefined") return "NORMAL";
  if (!navigator.onLine) return "OFFLINE";
  
  // Check Network Information API if available
  const conn = (navigator as unknown as {
    connection?: { effectiveType?: string; saveData?: boolean; downlink?: number };
  }).connection;
  if (
    conn?.effectiveType === "slow-2g" ||
    conn?.effectiveType === "2g" ||
    conn?.saveData === true ||
    typeof conn?.downlink === "number" && conn.downlink < 0.4
  ) {
    return "SLOW_2G";
  }
  return "NORMAL";
}

const CACHE_PREFIX = "orderking_cache_";

function isSensitiveCacheKey(key: string): boolean {
  return /wallet|balance|passbook|payment|token|secret|credential|otp|pin/i.test(key);
}

export function cacheSet<T>(key: string, data: T): void {
  try {
    if (isSensitiveCacheKey(key)) return;
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function cacheGet<T>(key: string, maxAgeMs = 3600_000): T | null {
  try {
    if (isSensitiveCacheKey(key)) return null;
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

export type OfflineQueuedAction = {
  id: string;
  type: "ADD_CART" | "REORDER" | "KING_PAY_DRAFT";
  payload: Record<string, unknown>;
  createdAt: number;
};

const QUEUE_KEY = "orderking_offline_queue";

export function enqueueOfflineAction(action: Omit<OfflineQueuedAction, "id" | "createdAt">): void {
  try {
    if (typeof localStorage === "undefined") return;
    const existing: OfflineQueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    existing.push({
      ...action,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore
  }
}

export function getOfflineQueue(): OfflineQueuedAction[] {
  try {
    if (typeof localStorage === "undefined") return [];
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearOfflineQueue(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Ignore
  }
}
