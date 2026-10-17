/**
 * TIMED ITEM OUT-OF-STOCK AUTO-RESET ENGINE
 * Authentic Zomato Partner Parity:
 * 1. 'Turn off for 2 Hours' (Lunch rush recovery)
 * 2. 'Turn off for 4 Hours'
 * 3. 'Turn off until Tomorrow 8:00 AM' (Standard end-of-day stockout)
 * 4. 'Turn off Indefinitely'
 *
 * Provides client-side and server-side automated local time scheduling,
 * expiration detection, and instant auto-restoration back to IN STOCK.
 */

import type { AvailabilityStatus } from "@/lib/contracts";

export type TimedStockoutOption =
  | "TURN_OFF_2_HOURS"
  | "TURN_OFF_4_HOURS"
  | "TURN_OFF_TOMORROW_8AM"
  | "TURN_OFF_INDEFINITELY";

export interface StockoutPresetConfig {
  id: TimedStockoutOption;
  label: string;
  sublabel: string;
  durationHours?: number;
  icon: string;
}

export const ZOMATO_STOCKOUT_PRESETS: StockoutPresetConfig[] = [
  {
    id: "TURN_OFF_2_HOURS",
    label: "Turn off for 2 Hours",
    sublabel: "Lunch rush recovery",
    durationHours: 2,
    icon: "Clock",
  },
  {
    id: "TURN_OFF_4_HOURS",
    label: "Turn off for 4 Hours",
    sublabel: "Shift recovery",
    durationHours: 4,
    icon: "Clock",
  },
  {
    id: "TURN_OFF_TOMORROW_8AM",
    label: "Turn off until Tomorrow 8:00 AM",
    sublabel: "Standard end-of-day stockout",
    icon: "Sunrise",
  },
  {
    id: "TURN_OFF_INDEFINITELY",
    label: "Turn off Indefinitely",
    sublabel: "Manual turn on required",
    icon: "Infinity",
  },
];

/**
 * Calculates the exact Tomorrow 08:00 AM timestamp.
 * Standard Zomato end-of-day stockout resets at 08:00 AM the following calendar day.
 */
export function getTomorrow08AM(refDate: Date = new Date()): Date {
  const target = new Date(refDate.getTime());
  target.setDate(target.getDate() + 1);
  target.setHours(8, 0, 0, 0);
  return target;
}

/**
 * Computes the target expiration Date and availability status for a given preset option.
 */
export function calculateStockoutExpiry(
  option: TimedStockoutOption,
  refDate: Date = new Date()
): {
  status: AvailabilityStatus;
  nextAvailableAt: string | null;
  expiryDate: Date | null;
  label: string;
} {
  if (option === "TURN_OFF_INDEFINITELY") {
    return {
      status: "sold_out",
      nextAvailableAt: null,
      expiryDate: null,
      label: "Turn off Indefinitely",
    };
  }

  if (option === "TURN_OFF_2_HOURS") {
    const expiry = new Date(refDate.getTime() + 2 * 60 * 60 * 1000);
    return {
      status: "temporarily_unavailable",
      nextAvailableAt: expiry.toISOString(),
      expiryDate: expiry,
      label: "Turn off for 2 Hours",
    };
  }

  if (option === "TURN_OFF_4_HOURS") {
    const expiry = new Date(refDate.getTime() + 4 * 60 * 60 * 1000);
    return {
      status: "temporarily_unavailable",
      nextAvailableAt: expiry.toISOString(),
      expiryDate: expiry,
      label: "Turn off for 4 Hours",
    };
  }

  if (option === "TURN_OFF_TOMORROW_8AM") {
    const expiry = getTomorrow08AM(refDate);
    return {
      status: "temporarily_unavailable",
      nextAvailableAt: expiry.toISOString(),
      expiryDate: expiry,
      label: "Turn off until Tomorrow 8:00 AM",
    };
  }

  throw new Error(`Unsupported timed stockout option: ${option}`);
}

/**
 * Checks if a timed item's out-of-stock window has expired.
 */
export function isStockoutExpired(nextAvailableAt?: string | null, now: Date = new Date()): boolean {
  if (!nextAvailableAt) return false;
  const expiryTime = new Date(nextAvailableAt).getTime();
  if (isNaN(expiryTime)) return false;
  return expiryTime <= now.getTime();
}

/**
 * Formats remaining stockout time in authentic Zomato Partner style.
 */
export function formatStockoutRemaining(nextAvailableAt?: string | null, now: Date = new Date()): string {
  if (!nextAvailableAt) return "Turned off indefinitely";

  const targetDate = new Date(nextAvailableAt);
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Auto-restoring...";
  }

  const diffMinutes = Math.ceil(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;

  // Check if target is Tomorrow 8:00 AM
  const tomorrow8 = getTomorrow08AM(now);
  const isTomorrow8AM =
    targetDate.getDate() === tomorrow8.getDate() &&
    targetDate.getMonth() === tomorrow8.getMonth() &&
    targetDate.getFullYear() === tomorrow8.getFullYear() &&
    targetDate.getHours() === 8 &&
    targetDate.getMinutes() === 0;

  if (isTomorrow8AM) {
    return "Until Tomorrow 8:00 AM";
  }

  if (diffMinutes < 60) {
    return `Auto-restores in ${diffMinutes}m`;
  }

  const timeFormatted = targetDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffHours < 24) {
    if (remainingMins === 0) {
      return `Until ${timeFormatted} (${diffHours}h)`;
    }
    return `Until ${timeFormatted} (${diffHours}h ${remainingMins}m)`;
  }

  return `Until ${targetDate.toLocaleDateString([], { month: "short", day: "numeric" })} 8:00 AM`;
}

/**
 * Evaluates a list of menu items and returns all item IDs that have expired
 * and require automatic reactivation back to "available".
 */
export function findExpiredItemIds(
  items: Array<{ id: string; availability: string; nextAvailableAt?: string | null }>,
  now: Date = new Date()
): string[] {
  return items
    .filter(
      (item) =>
        item.availability === "temporarily_unavailable" &&
        item.nextAvailableAt &&
        isStockoutExpired(item.nextAvailableAt, now)
    )
    .map((item) => item.id);
}

/**
 * LocalStockoutScheduler:
 * Automatic local time scheduler and Supabase timer that tracks all timed out-of-stock items.
 * Sets high-precision timers that fire the moment a dish's timestamp expires,
 * invoking reactivation without requiring the kitchen manager to remember.
 */
export class LocalStockoutScheduler {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private periodicInterval: ReturnType<typeof setInterval> | null = null;
  private onReactivate: (itemIds: string[]) => void | Promise<void>;

  constructor(onReactivate: (itemIds: string[]) => void | Promise<void>) {
    this.onReactivate = onReactivate;
  }

  /**
   * Synchronizes scheduler with the current list of items.
   * Cancels stale timers and schedules exact expiry timers for active timed items.
   */
  public sync(items: Array<{ id: string; availability: string; nextAvailableAt?: string | null }>): void {
    const activeTimedItemIds = new Set<string>();
    const now = new Date();

    // 1. Immediately check for any items already expired
    const expiredIds = findExpiredItemIds(items, now);
    if (expiredIds.length > 0) {
      void this.onReactivate(expiredIds);
    }

    // 2. Schedule timers for future expiring items
    for (const item of items) {
      if (item.availability === "temporarily_unavailable" && item.nextAvailableAt) {
        const expiryTime = new Date(item.nextAvailableAt).getTime();
        if (!isNaN(expiryTime) && expiryTime > now.getTime()) {
          activeTimedItemIds.add(item.id);
          this.scheduleItemTimer(item.id, expiryTime);
        }
      }
    }

    // 3. Clear timers for items that are no longer timed out-of-stock
    for (const [itemId, timer] of this.timers.entries()) {
      if (!activeTimedItemIds.has(itemId)) {
        clearTimeout(timer);
        this.timers.delete(itemId);
      }
    }

    // 4. Ensure safety periodic sweep every 15 seconds
    if (!this.periodicInterval) {
      this.periodicInterval = setInterval(() => {
        const sweepExpired = findExpiredItemIds(items, new Date());
        if (sweepExpired.length > 0) {
          void this.onReactivate(sweepExpired);
        }
      }, 15_000);
    }
  }

  private scheduleItemTimer(itemId: string, expiryTimestamp: number): void {
    // If timer already scheduled, cancel previous
    if (this.timers.has(itemId)) {
      clearTimeout(this.timers.get(itemId)!);
      this.timers.delete(itemId);
    }

    const delayMs = Math.max(50, expiryTimestamp - Date.now());
    // Node / Browser safe timer (clamped to max 32-bit signed int ~24.8 days)
    const clampedDelay = Math.min(delayMs, 2_147_483_647);

    const timer = setTimeout(() => {
      this.timers.delete(itemId);
      void this.onReactivate([itemId]);
    }, clampedDelay);

    this.timers.set(itemId, timer);
  }

  /**
   * Returns count of currently active scheduled item timers.
   */
  public getActiveTimerCount(): number {
    return this.timers.size;
  }

  /**
   * Cleans up all timeouts and background intervals.
   */
  public dispose(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    if (this.periodicInterval) {
      clearInterval(this.periodicInterval);
      this.periodicInterval = null;
    }
  }
}
