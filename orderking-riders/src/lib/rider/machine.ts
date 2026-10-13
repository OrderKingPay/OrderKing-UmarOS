import {
  TERMINAL_DELIVERY_STATES,
  RiderError,
  type DeliveryState,
} from "./types.ts";

export const CANONICAL_LIFECYCLE_STATES = [
  "OFFER_PRESENTED",
  "ACCEPTED",
  "ARRIVED_AT_STORE",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type CanonicalLifecycleState = (typeof CANONICAL_LIFECYCLE_STATES)[number];

const ALLOWED: Record<DeliveryState, ReadonlyArray<DeliveryState>> = {
  OFFERED: ["ACCEPTED", "RIDER_DECLINED", "OFFER_EXPIRED", "ORDER_CANCELLED"],
  OFFER_PRESENTED: ["ACCEPTED", "RIDER_DECLINED", "OFFER_EXPIRED", "ORDER_CANCELLED"],
  ACCEPTED: [
    "ARRIVING_AT_RESTAURANT",
    "ARRIVED_AT_RESTAURANT",
    "ARRIVED_AT_STORE",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
  ],
  ARRIVING_AT_RESTAURANT: [
    "ARRIVED_AT_RESTAURANT",
    "ARRIVED_AT_STORE",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
  ],
  ARRIVED_AT_RESTAURANT: [
    "PICKED_UP",
    "RESTAURANT_NOT_READY",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
  ],
  ARRIVED_AT_STORE: [
    "PICKED_UP",
    "RESTAURANT_NOT_READY",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
  ],
  RESTAURANT_NOT_READY: [
    "PICKED_UP",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
  ],
  PICKED_UP: [
    "ON_THE_WAY",
    "OUT_FOR_DELIVERY",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
  ],
  ON_THE_WAY: [
    "ARRIVED_AT_CUSTOMER",
    "DELIVERED",
    "CUSTOMER_UNAVAILABLE",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
    "DELIVERY_FAILED",
  ],
  OUT_FOR_DELIVERY: [
    "ARRIVED_AT_CUSTOMER",
    "DELIVERED",
    "CUSTOMER_UNAVAILABLE",
    "RIDER_CANCELLED",
    "ORDER_CANCELLED",
    "SUPPORT_ESCALATION",
    "DELIVERY_FAILED",
  ],
  ARRIVED_AT_CUSTOMER: [
    "DELIVERED",
    "CUSTOMER_UNAVAILABLE",
    "DELIVERY_FAILED",
    "SUPPORT_ESCALATION",
    "ORDER_CANCELLED",
  ],
  CUSTOMER_UNAVAILABLE: [
    "SUPPORT_ESCALATION",
    "DELIVERY_FAILED",
    "ORDER_CANCELLED",
  ],
  SUPPORT_ESCALATION: [
    "DELIVERED",
    "DELIVERY_FAILED",
    "ORDER_CANCELLED",
    "PICKED_UP",
    "ON_THE_WAY",
    "OUT_FOR_DELIVERY",
    "ARRIVED_AT_CUSTOMER",
    "ARRIVED_AT_RESTAURANT",
    "ARRIVED_AT_STORE",
  ],
  DELIVERED: [],
  OFFER_EXPIRED: [],
  RIDER_DECLINED: [],
  RIDER_CANCELLED: [],
  DELIVERY_FAILED: [],
  ORDER_CANCELLED: [],
};

export function canTransition(from: DeliveryState, to: DeliveryState): boolean {
  if (from === to) return false;
  return (ALLOWED[from] ?? []).includes(to);
}

export function assertTransition(from: DeliveryState, to: DeliveryState): void {
  if (!canTransition(from, to)) {
    throw new RiderError("INVALID_STATE", `Invalid delivery transition ${from} → ${to}`, 409);
  }
}

export function isTerminal(state: DeliveryState): boolean {
  return TERMINAL_DELIVERY_STATES.has(state);
}

export function isActiveDelivery(state: DeliveryState): boolean {
  return (
    !isTerminal(state) &&
    state !== "OFFERED" &&
    state !== "OFFER_PRESENTED" &&
    state !== "RIDER_DECLINED" &&
    state !== "OFFER_EXPIRED"
  );
}

export function requiresOtpToDeliver(state: DeliveryState): boolean {
  return (
    state === "ARRIVED_AT_CUSTOMER" ||
    state === "ON_THE_WAY" ||
    state === "OUT_FOR_DELIVERY" ||
    state === "SUPPORT_ESCALATION"
  );
}
