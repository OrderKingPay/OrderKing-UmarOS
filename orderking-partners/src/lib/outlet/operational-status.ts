/**
 * OUTLET EMERGENCY PAUSE & OPERATIONAL STATUS ENGINE
 * Authentic Tier-1 Leader Merchant Operations & Kitchen Shield:
 * - 🟢 Online (Accepting Orders)
 * - 🟡 Paused for 30 Mins (Kitchen Catch-up)
 * - 🟡 Paused for 60 Mins (Lunch / Dinner Surge Recovery)
 * - 🔴 Offline (Closed for the Day)
 *
 * Provides reactive local persistence, automatic auto-resumption when timers expire,
 * customer app notice generation, and instant server synchronization.
 */

import { create } from "zustand";

export type OutletOperationalStatus =
  | "ONLINE"
  | "PAUSED_30"
  | "PAUSED_60"
  | "OFFLINE";

export interface OutletStatusPresetConfig {
  id: OutletOperationalStatus;
  label: string;
  sublabel: string;
  dotColor: "green" | "yellow" | "red";
  icon: string;
  pauseMinutes?: number;
  customerHeadline: string;
  customerSubtext: string;
}

export const OUTLET_STATUS_PRESETS: readonly OutletStatusPresetConfig[] = [
  {
    id: "ONLINE",
    label: "Online (Accepting Orders)",
    sublabel: "Normal kitchen operations",
    dotColor: "green",
    icon: "CheckCircle2",
    customerHeadline: "Accepting Orders",
    customerSubtext: "Kitchen is live and preparing orders.",
  },
  {
    id: "PAUSED_30",
    label: "Paused for 30 Mins (Kitchen Catch-up)",
    sublabel: "Quick ticket clearance",
    dotColor: "yellow",
    icon: "Clock",
    pauseMinutes: 30,
    customerHeadline: "Currently not accepting orders",
    customerSubtext: "Back in 30 mins · Kitchen is catching up on current live orders",
  },
  {
    id: "PAUSED_60",
    label: "Paused for 60 Mins (Lunch / Dinner Surge Recovery)",
    sublabel: "Rush hour surge relief",
    dotColor: "yellow",
    icon: "Clock",
    pauseMinutes: 60,
    customerHeadline: "Currently not accepting orders",
    customerSubtext: "Back in 60 mins · Kitchen is undergoing surge recovery",
  },
  {
    id: "OFFLINE",
    label: "Offline (Closed for the Day)",
    sublabel: "No new orders will be accepted",
    dotColor: "red",
    icon: "XCircle",
    customerHeadline: "Currently closed for the day",
    customerSubtext: "Outlet is closed · Opens during scheduled operating hours tomorrow",
  },
] as const;

export const STORAGE_OUTLET_STATUS_KEY = "ok_outlet_operational_status";
export const STORAGE_OUTLET_PAUSED_UNTIL_KEY = "ok_outlet_paused_until";
export const STORAGE_OUTLET_REASON_KEY = "ok_outlet_pause_reason";

export interface OutletStatusState {
  status: OutletOperationalStatus;
  pausedUntil: string | null;
  reason: string | null;
  updatedAt: string | null;
  setStatus: (
    status: OutletOperationalStatus,
    options?: {
      restaurantId?: string;
      customReason?: string;
      refDate?: Date;
      onServerSync?: (mode: "NORMAL" | "PAUSE" | "RESUME") => Promise<void> | void;
    }
  ) => void;
  pauseForMinutes: (
    minutes: 30 | 60,
    restaurantId?: string,
    onServerSync?: (mode: "NORMAL" | "PAUSE" | "RESUME") => Promise<void> | void
  ) => void;
  resumeOnline: (
    restaurantId?: string,
    onServerSync?: (mode: "NORMAL" | "PAUSE" | "RESUME") => Promise<void> | void
  ) => void;
  setOffline: (
    restaurantId?: string,
    onServerSync?: (mode: "NORMAL" | "PAUSE" | "RESUME") => Promise<void> | void
  ) => void;
  checkAutoResume: (now?: Date) => boolean;
}

/**
 * Calculates paused until ISO timestamp based on status preset.
 */
export function calculatePausedUntil(
  status: OutletOperationalStatus,
  refDate: Date = new Date()
): string | null {
  if (status === "PAUSED_30") {
    return new Date(refDate.getTime() + 30 * 60 * 1000).toISOString();
  }
  if (status === "PAUSED_60") {
    return new Date(refDate.getTime() + 60 * 60 * 1000).toISOString();
  }
  return null;
}

/**
 * Checks if a timed kitchen pause has expired.
 */
export function isOutletPauseExpired(
  pausedUntil: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!pausedUntil) return false;
  const expiryTime = new Date(pausedUntil).getTime();
  if (isNaN(expiryTime)) return false;
  return expiryTime <= now.getTime();
}

/**
 * Formats remaining pause duration for UI display (e.g., 'Back in 28 mins').
 */
export function formatOutletPauseRemaining(
  pausedUntil: string | null | undefined,
  now: Date = new Date()
): string {
  if (!pausedUntil) return "Paused";

  const expiry = new Date(pausedUntil).getTime();
  const diffMs = expiry - now.getTime();

  if (diffMs <= 0) {
    return "Auto-resuming...";
  }

  const mins = Math.ceil(diffMs / 60_000);
  if (mins < 60) {
    return `Back in ${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (remMins === 0) {
    return `Back in ${hours}h`;
  }
  return `Back in ${hours}h ${remMins}m`;
}

/**
 * Returns customer-facing messaging and badge metadata for the consumer app.
 */
export function getOutletCustomerNotice(
  status: OutletOperationalStatus,
  pausedUntil?: string | null,
  now: Date = new Date()
): {
  isAccepting: boolean;
  headline: string;
  subtext: string;
  badgeLabel: string;
  tone: "green" | "yellow" | "red";
} {
  if (status === "ONLINE") {
    return {
      isAccepting: true,
      headline: "Accepting Orders",
      subtext: "Delivering fast & fresh to your location",
      badgeLabel: "Accepting Orders",
      tone: "green",
    };
  }

  if (status === "OFFLINE") {
    return {
      isAccepting: false,
      headline: "Currently closed for the day",
      subtext: "Outlet is closed for today. Order opens tomorrow morning.",
      badgeLabel: "Closed for Today",
      tone: "red",
    };
  }

  // PAUSED_30 or PAUSED_60
  const remainingStr = formatOutletPauseRemaining(pausedUntil, now);
  const is30 = status === "PAUSED_30";
  return {
    isAccepting: false,
    headline: "Currently not accepting orders",
    subtext: is30
      ? `Back in 30 mins · Kitchen is catching up on live orders (${remainingStr})`
      : `Back in 60 mins · Kitchen surge recovery in progress (${remainingStr})`,
    badgeLabel: `Currently not accepting orders / ${remainingStr}`,
    tone: "yellow",
  };
}

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

function getInitialOutletState(): {
  status: OutletOperationalStatus;
  pausedUntil: string | null;
  reason: string | null;
} {
  const storage = getStorage();
  if (!storage) {
    return { status: "ONLINE", pausedUntil: null, reason: null };
  }

  try {
    const savedStatus = storage.getItem(STORAGE_OUTLET_STATUS_KEY) as OutletOperationalStatus | null;
    const savedUntil = storage.getItem(STORAGE_OUTLET_PAUSED_UNTIL_KEY);
    const savedReason = storage.getItem(STORAGE_OUTLET_REASON_KEY);

    if (savedStatus && ["ONLINE", "PAUSED_30", "PAUSED_60", "OFFLINE"].includes(savedStatus)) {
      // If paused but timer expired, automatically revert to ONLINE
      if ((savedStatus === "PAUSED_30" || savedStatus === "PAUSED_60") && isOutletPauseExpired(savedUntil)) {
        storage.setItem(STORAGE_OUTLET_STATUS_KEY, "ONLINE");
        storage.removeItem(STORAGE_OUTLET_PAUSED_UNTIL_KEY);
        storage.removeItem(STORAGE_OUTLET_REASON_KEY);
        return { status: "ONLINE", pausedUntil: null, reason: null };
      }
      return { status: savedStatus, pausedUntil: savedUntil ?? null, reason: savedReason ?? null };
    }
  } catch {
    // Ignore storage parse errors
  }

  return { status: "ONLINE", pausedUntil: null, reason: null };
}

export const useOutletStatusStore = create<OutletStatusState>((set, get) => {
  const initial = getInitialOutletState();

  return {
    status: initial.status,
    pausedUntil: initial.pausedUntil,
    reason: initial.reason,
    updatedAt: new Date().toISOString(),

    setStatus: (newStatus, options) => {
      const refDate = options?.refDate ?? new Date();
      const pausedUntil = calculatePausedUntil(newStatus, refDate);
      const reason = options?.customReason ?? (newStatus === "ONLINE" ? null : newStatus);

      const storage = getStorage();
      if (storage) {
        try {
          storage.setItem(STORAGE_OUTLET_STATUS_KEY, newStatus);
          if (pausedUntil) {
            storage.setItem(STORAGE_OUTLET_PAUSED_UNTIL_KEY, pausedUntil);
          } else {
            storage.removeItem(STORAGE_OUTLET_PAUSED_UNTIL_KEY);
          }
          if (reason) {
            storage.setItem(STORAGE_OUTLET_REASON_KEY, reason);
          } else {
            storage.removeItem(STORAGE_OUTLET_REASON_KEY);
          }
        } catch {
          // ignore storage error
        }
      }

      set({
        status: newStatus,
        pausedUntil,
        reason,
        updatedAt: refDate.toISOString(),
      });

      // Synchronize with server
      const serverMode = newStatus === "ONLINE" ? "RESUME" : "PAUSE";
      if (options?.onServerSync) {
        void options.onServerSync(serverMode);
      }
    },

    pauseForMinutes: (minutes, restaurantId, onServerSync) => {
      const newStatus = minutes === 30 ? "PAUSED_30" : "PAUSED_60";
      get().setStatus(newStatus, { restaurantId, onServerSync });
    },

    resumeOnline: (restaurantId, onServerSync) => {
      get().setStatus("ONLINE", { restaurantId, onServerSync });
    },

    setOffline: (restaurantId, onServerSync) => {
      get().setStatus("OFFLINE", { restaurantId, onServerSync });
    },

    checkAutoResume: (now = new Date()) => {
      const current = get();
      if ((current.status === "PAUSED_30" || current.status === "PAUSED_60") && isOutletPauseExpired(current.pausedUntil, now)) {
        get().resumeOnline();
        return true;
      }
      return false;
    },
  };
});
