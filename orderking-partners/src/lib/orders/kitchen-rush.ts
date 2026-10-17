/**
 * KITCHEN RUSH / OVERLOAD BUFFER MODE ENGINE
 * Authentic Tier-1 Leader Partner Parity:
 * - Prominent Amber/Red status banner and header toggle.
 * - Adds a configurable buffer (+10 mins or +15 mins) to active incoming order prep times.
 * - Dynamically pushes back rider dispatch and arrival windows to eliminate courier idle wait.
 * - Generates polite "Kitchen is experiencing heavy rush" customer-facing notice.
 */

import { create } from "zustand";

export type KitchenRushBufferMinutes = 10 | 15;

export interface KitchenRushState {
  isActive: boolean;
  bufferMinutes: KitchenRushBufferMinutes;
  activatedAt: string | null;
  activate: (buffer?: KitchenRushBufferMinutes) => void;
  deactivate: () => void;
  setBuffer: (buffer: KitchenRushBufferMinutes) => void;
}

const STORAGE_ACTIVE_KEY = "ok_kitchen_rush_active";
const STORAGE_BUFFER_KEY = "ok_kitchen_throttle_buffer";

function getInitialState(): { isActive: boolean; bufferMinutes: KitchenRushBufferMinutes } {
  if (typeof window === "undefined") {
    return { isActive: false, bufferMinutes: 15 };
  }
  const activeStr = localStorage.getItem(STORAGE_ACTIVE_KEY);
  const bufferStr = localStorage.getItem(STORAGE_BUFFER_KEY);
  const parsedBuffer = bufferStr === "10" ? 10 : 15;
  const isActive = activeStr === "true" || (parseInt(bufferStr ?? "0", 10) > 0);
  return {
    isActive,
    bufferMinutes: parsedBuffer,
  };
}

export const useKitchenRushStore = create<KitchenRushState>((set) => {
  const initial = getInitialState();

  return {
    isActive: initial.isActive,
    bufferMinutes: initial.bufferMinutes,
    activatedAt: initial.isActive ? new Date().toISOString() : null,

    activate: (buffer = 15) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE_KEY, "true");
        localStorage.setItem(STORAGE_BUFFER_KEY, buffer.toString());
      }
      set({
        isActive: true,
        bufferMinutes: buffer,
        activatedAt: new Date().toISOString(),
      });
    },

    deactivate: () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE_KEY, "false");
        localStorage.setItem(STORAGE_BUFFER_KEY, "0");
      }
      set({
        isActive: false,
        activatedAt: null,
      });
    },

    setBuffer: (buffer: KitchenRushBufferMinutes) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE_KEY, "true");
        localStorage.setItem(STORAGE_BUFFER_KEY, buffer.toString());
      }
      set({
        isActive: true,
        bufferMinutes: buffer,
      });
    },
  };
});

export interface CustomerRushBadge {
  headline: string;
  message: string;
  badgeText: string;
  tone: "amber" | "rose";
}

export interface RushAdjustedOrderEta {
  orderId: string;
  originalPrepMinutes: number;
  bufferedPrepMinutes: number;
  bufferMinutes: number;
  courierTransitMinutes: number;
  orderPlacedAt: string;
  originalReadyAt: string;
  adjustedReadyAt: string;
  originalRiderDispatchAt: string;
  adjustedRiderDispatchAt: string;
  originalRiderArrivalAt: string;
  adjustedRiderArrivalAt: string;
  riderArrivalDelayMinutes: number;
  customerBadge: CustomerRushBadge;
}

/**
 * Calculates dynamic ETA, prep time, and rider arrival window adjustments
 * when Kitchen Rush Mode is active.
 */
export function calculateOrderRushEta(
  order: {
    id: string;
    prepMinutes: number;
    placedAt?: string | Date | null;
  },
  bufferMinutes: KitchenRushBufferMinutes,
  courierTransitMinutes: number = 10,
  referenceNow: Date = new Date()
): RushAdjustedOrderEta {
  const basePrep = Math.max(5, Number(order.prepMinutes) || 20);
  const bufferedPrep = basePrep + bufferMinutes;

  const placedDate = order.placedAt ? new Date(order.placedAt) : referenceNow;
  const placedTime = isNaN(placedDate.getTime()) ? referenceNow.getTime() : placedDate.getTime();

  // Original ready time without rush buffer
  const originalReadyTimestamp = placedTime + basePrep * 60_000;
  // Adjusted ready time with configured rush buffer (+10m or +15m)
  const adjustedReadyTimestamp = placedTime + bufferedPrep * 60_000;

  // Courier transit time
  const transitMs = courierTransitMinutes * 60_000;

  // Courier dispatch trigger: when system pings courier so they arrive exactly when food is ready
  const originalDispatchTimestamp = originalReadyTimestamp - transitMs;
  const adjustedDispatchTimestamp = adjustedReadyTimestamp - transitMs;

  // Expected courier arrival at kitchen
  const originalArrivalTimestamp = originalReadyTimestamp;
  const adjustedArrivalTimestamp = adjustedReadyTimestamp;

  const tone: "amber" | "rose" = bufferMinutes >= 15 ? "rose" : "amber";

  return {
    orderId: order.id,
    originalPrepMinutes: basePrep,
    bufferedPrepMinutes: bufferedPrep,
    bufferMinutes,
    courierTransitMinutes,
    orderPlacedAt: new Date(placedTime).toISOString(),
    originalReadyAt: new Date(originalReadyTimestamp).toISOString(),
    adjustedReadyAt: new Date(adjustedReadyTimestamp).toISOString(),
    originalRiderDispatchAt: new Date(originalDispatchTimestamp).toISOString(),
    adjustedRiderDispatchAt: new Date(adjustedDispatchTimestamp).toISOString(),
    originalRiderArrivalAt: new Date(originalArrivalTimestamp).toISOString(),
    adjustedRiderArrivalAt: new Date(adjustedArrivalTimestamp).toISOString(),
    riderArrivalDelayMinutes: bufferMinutes,
    customerBadge: {
      headline: "Kitchen is experiencing heavy rush",
      message: `Our kitchen is currently experiencing heavy rush. Your order is being prepared with extra care, and your delivery window has been calibrated by +${bufferMinutes} mins.`,
      badgeText: `Kitchen is experiencing heavy rush (+${bufferMinutes}m)`,
      tone,
    },
  };
}

/**
 * Batch calculation across all active incoming orders during Kitchen Rush Mode.
 */
export function calculateBatchRushAdjustments(
  orders: Array<{ id: string; prepMinutes: number; placedAt?: string | Date | null; state?: string }>,
  bufferMinutes: KitchenRushBufferMinutes,
  courierTransitMinutes: number = 10,
  referenceNow: Date = new Date()
): Map<string, RushAdjustedOrderEta> {
  const map = new Map<string, RushAdjustedOrderEta>();
  for (const order of orders) {
    map.set(
      order.id,
      calculateOrderRushEta(order, bufferMinutes, courierTransitMinutes, referenceNow)
    );
  }
  return map;
}
