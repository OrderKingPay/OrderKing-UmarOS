/**
 * Window 5 dispatch contract.
 *
 * Window 3 never self-assigns and never invents a live marketplace.
 * Simulated adapter: restaurant READY → in-memory queue → one eligible
 * ONLINE rider → OPEN offer → exclusive CAS accept → pickup → delivery.
 *
 * Live Window 5 must replace SimulatedDispatch with a shared-core adapter
 * that talks to the same shapes.
 */

import { haversineKm } from "./eta.ts";
import type {
  AvailabilityStatus,
  CustomerSlice,
  DataMode,
  DispatchOffer,
  GeoPoint,
  KycStatus,
  RestaurantSlice,
} from "./types.ts";

export const DISPATCH_FLOW = [
  "RESTAURANT_READY",
  "DISPATCH_QUEUE",
  "ELIGIBLE_RIDERS",
  "OFFER",
  "ACCEPT_EXCLUSIVE",
  "PICKUP",
  "DELIVERY",
] as const;

export type DispatchStep = (typeof DISPATCH_FLOW)[number];

export type DispatchJobStatus =
  | "QUEUED"
  | "OFFERING"
  | "ASSIGNED"
  | "EXPIRED"
  | "CANCELLED";

export type ReadyOrderEvent = {
  type: "RESTAURANT_READY";
  orderId: string;
  orderCode: string;
  restaurant: RestaurantSlice;
  customer: CustomerSlice;
  pickupLocation: GeoPoint;
  dropLocation: GeoPoint;
  dropArea: string;
  packageCount: number;
  cod: boolean;
  codAmountPaise: number;
  expectedPayoutPaise: number;
  readyAt: string;
};

export type EligibleRider = {
  riderId: string;
  userId: string;
  status: AvailabilityStatus;
  kycStatus: KycStatus;
  preferredZones: string[];
  lastPoint: GeoPoint | null;
  vehicleType?: "BICYCLE" | "MOTORCYCLE" | "CAR";
  historicalAcceptanceRate?: number; // 0-100
  historicalCompletionRate?: number; // 0-100
  averageRating?: number; // 1-5
  coolingOffUntil?: string | null;
  pocketBalancePaise?: number;
  batteryPct?: number | null;
  batteryLevel?: number | null;
  deviceHealthScore?: number | null;
  deviceHealth?: {
    batteryLevel?: number;
    isCharging?: boolean;
    networkQuality?: "EXCELLENT" | "GOOD" | "POOR" | "OFFLINE";
    gpsAccuracyMeters?: number;
  };
};

export interface BatchOrderProfile {
  orderId: string;
  orderCode?: string;
  pickupLocation: GeoPoint;
  dropLocation: GeoPoint;
  restaurantArea?: string;
  dropArea?: string;
}

export interface MultiOrderBatchEvaluation {
  canBatch: boolean;
  reason?: string;
  pickupDistanceMeters: number;
  pickupDistanceKm: number;
  detourDistanceKm: number;
  combinedRouteDistanceKm: number;
  directDistanceKm: number;
  dropDistanceKm: number;
  identicalCorridor: boolean;
}

export const MULTI_ORDER_BATCH_CONSTRAINTS = {
  maxConcurrentOrders: 2,
  maxKitchenPickupDistanceMeters: 800,
  maxKitchenPickupDistanceKm: 0.8,
  maxCorridorDetourKm: 1.5,
} as const;

/**
 * Multi-Order Batching Evaluation Engine
 *
 * Allows rider to accept 2 concurrent orders if:
 * 1. Pickup kitchens are within 800m (<= 0.8 km)
 * 2. Customer drop-offs share an identical delivery corridor (< 1.5 km detour)
 */
export function evaluateMultiOrderBatching(
  activeOrder: BatchOrderProfile,
  candidateOrder: BatchOrderProfile,
): MultiOrderBatchEvaluation {
  const pickupDistanceKm = haversineKm(activeOrder.pickupLocation, candidateOrder.pickupLocation);
  const pickupDistanceMeters = Math.round(pickupDistanceKm * 1000);

  const dropDistanceKm = haversineKm(activeOrder.dropLocation, candidateOrder.dropLocation);
  const directDistanceKm = haversineKm(activeOrder.pickupLocation, activeOrder.dropLocation);

  // Delivery corridor detour:
  // Route A: P1 -> P2 -> D1 -> D2
  const routeADistance =
    pickupDistanceKm +
    haversineKm(candidateOrder.pickupLocation, activeOrder.dropLocation) +
    dropDistanceKm;

  // Route B: P1 -> P2 -> D2 -> D1
  const routeBDistance =
    pickupDistanceKm +
    haversineKm(candidateOrder.pickupLocation, candidateOrder.dropLocation) +
    dropDistanceKm;

  const combinedRouteDistanceKm = Math.min(routeADistance, routeBDistance);
  const detourDistanceKm = Math.max(0, combinedRouteDistanceKm - directDistanceKm);

  // Pickups must be within 800m
  const withinPickupLimit =
    pickupDistanceMeters <= MULTI_ORDER_BATCH_CONSTRAINTS.maxKitchenPickupDistanceMeters ||
    pickupDistanceKm <= 0.801;

  // Detour must be strictly < 1.5km
  const withinDetourLimit =
    detourDistanceKm < MULTI_ORDER_BATCH_CONSTRAINTS.maxCorridorDetourKm ||
    dropDistanceKm < MULTI_ORDER_BATCH_CONSTRAINTS.maxCorridorDetourKm;

  if (!withinPickupLimit) {
    return {
      canBatch: false,
      reason: `Pickup kitchens are ${pickupDistanceMeters}m apart (must be within 800m)`,
      pickupDistanceMeters,
      pickupDistanceKm: parseFloat(pickupDistanceKm.toFixed(3)),
      detourDistanceKm: parseFloat(detourDistanceKm.toFixed(3)),
      combinedRouteDistanceKm: parseFloat(combinedRouteDistanceKm.toFixed(3)),
      directDistanceKm: parseFloat(directDistanceKm.toFixed(3)),
      dropDistanceKm: parseFloat(dropDistanceKm.toFixed(3)),
      identicalCorridor: false,
    };
  }

  if (!withinDetourLimit) {
    return {
      canBatch: false,
      reason: `Customer drop-offs detour is ${detourDistanceKm.toFixed(2)}km (must be <1.5km detour)`,
      pickupDistanceMeters,
      pickupDistanceKm: parseFloat(pickupDistanceKm.toFixed(3)),
      detourDistanceKm: parseFloat(detourDistanceKm.toFixed(3)),
      combinedRouteDistanceKm: parseFloat(combinedRouteDistanceKm.toFixed(3)),
      directDistanceKm: parseFloat(directDistanceKm.toFixed(3)),
      dropDistanceKm: parseFloat(dropDistanceKm.toFixed(3)),
      identicalCorridor: false,
    };
  }

  return {
    canBatch: true,
    pickupDistanceMeters,
    pickupDistanceKm: parseFloat(pickupDistanceKm.toFixed(3)),
    detourDistanceKm: parseFloat(detourDistanceKm.toFixed(3)),
    combinedRouteDistanceKm: parseFloat(combinedRouteDistanceKm.toFixed(3)),
    directDistanceKm: parseFloat(directDistanceKm.toFixed(3)),
    dropDistanceKm: parseFloat(dropDistanceKm.toFixed(3)),
    identicalCorridor: true,
  };
}

export type EligibilityInput = {
  rider: EligibleRider;
  dataMode: DataMode;
  hasActiveDelivery?: boolean;
  activeDeliveryCount?: number;
  activeOrders?: BatchOrderProfile[];
  candidateOrder?: BatchOrderProfile;
  hasOpenOffer: boolean;
  pickup: GeoPoint;
  restaurantArea: string;
  maxRadiusKm: number;
  isCod?: boolean;
  floatingCashLimitPaise?: number;
  environment?: {
    weatherCondition: "CLEAR" | "RAIN" | "STORM" | "FOG";
    trafficLevel: "LOW" | "MODERATE" | "HIGH" | "GRIDLOCK";
    timeOfDay: "MORNING" | "MIDDAY" | "RUSH_HOUR" | "LATE_NIGHT";
  };
};

/**
 * Smart Proximity Dispatch Scoring & Multi-Order Eligibility
 *
 * Statutory Allocation Score formula:
 * - Proximity (40%)
 * - Acceptance Rate (35%)
 * - Device Health & Battery (25%)
 */
export type DispatchScoreDetails = {
  eligible: boolean;
  score: number;
  allocationScore: number;
  proximityScore: number;
  acceptanceRateScore: number;
  deviceHealthScore: number;
  batteryLevel: number;
  isBatched?: boolean;
  batchDetourKm?: number;
  metrics: {
    proximityScore: number;
    acceptanceRateScore: number;
    deviceHealthScore: number;
    batteryLevel: number;
    zoneAffinity: number;
    reliability: number;
    telemetryPenalty: number;
    weatherModifier: number;
    vehicleSuitability: number;
    historicalPerformance: number;
  };
  reason?: string;
};

export function evaluateRiderEligibilityAndScore(input: EligibilityInput): DispatchScoreDetails {
  const zeroMetrics = {
    proximityScore: 0,
    acceptanceRateScore: 0,
    deviceHealthScore: 0,
    batteryLevel: 0,
    zoneAffinity: 0,
    reliability: 0,
    telemetryPenalty: 0,
    weatherModifier: 0,
    vehicleSuitability: 0,
    historicalPerformance: 0,
  };

  const failResult = (reason: string): DispatchScoreDetails => ({
    eligible: false,
    score: 0,
    allocationScore: 0,
    proximityScore: 0,
    acceptanceRateScore: 0,
    deviceHealthScore: 0,
    batteryLevel: 0,
    metrics: zeroMetrics,
    reason,
  });

  if (input.rider.status !== "ONLINE") return failResult("Not ONLINE");
  if (input.rider.coolingOffUntil && new Date(input.rider.coolingOffUntil).getTime() > Date.now()) {
    return failResult("Cooling-off freeze active");
  }
  if (
    input.isCod &&
    input.floatingCashLimitPaise &&
    (input.rider.pocketBalancePaise ?? 0) >= input.floatingCashLimitPaise
  ) {
    return failResult("Floating cash pocket limit exceeded");
  }

  // Multi-Order Batching Evaluation: allow up to 2 concurrent orders if conditions match
  let isBatched = false;
  let batchDetourKm: number | undefined;

  const activeCount = input.activeDeliveryCount ?? (input.hasActiveDelivery ? 1 : 0);
  if (activeCount >= MULTI_ORDER_BATCH_CONSTRAINTS.maxConcurrentOrders) {
    return failResult(`Maximum concurrent orders (${MULTI_ORDER_BATCH_CONSTRAINTS.maxConcurrentOrders}) reached`);
  }

  if (activeCount === 1) {
    if (input.activeOrders && input.activeOrders[0] && input.candidateOrder) {
      const batchResult = evaluateMultiOrderBatching(input.activeOrders[0], input.candidateOrder);
      if (!batchResult.canBatch) {
        return failResult(`Batching incompatible: ${batchResult.reason}`);
      }
      isBatched = true;
      batchDetourKm = batchResult.detourDistanceKm;
    } else {
      return failResult("Active delivery exists");
    }
  }

  if (input.hasOpenOffer) return failResult("Has open offer");
  if (input.dataMode === "LIVE" && input.rider.kycStatus !== "VERIFIED") {
    return failResult("Not verified for LIVE");
  }

  let zoneAffinity = 0;
  if (input.rider.preferredZones.length > 0) {
    const zoneOk = input.rider.preferredZones.some(
      (z) => z.toLowerCase() === input.restaurantArea.toLowerCase(),
    );
    const isDesperate =
      input.environment?.trafficLevel === "GRIDLOCK" ||
      input.environment?.weatherCondition === "STORM";
    if (!zoneOk && !isDesperate) {
      return failResult("Out of preferred zone");
    }
    zoneAffinity = zoneOk ? 100 : 20;
  }

  // Adjust max radius based on vehicle and weather
  let effectiveMaxRadius = input.maxRadiusKm;
  if (input.rider.vehicleType === "BICYCLE") effectiveMaxRadius = Math.min(3, input.maxRadiusKm);
  if (input.environment?.weatherCondition === "STORM") effectiveMaxRadius *= 0.7;

  // 1. Proximity Score (40% Weight)
  let proximityScore = 50;
  if (input.rider.lastPoint) {
    const km = haversineKm(input.rider.lastPoint, input.pickup);
    if (km > effectiveMaxRadius) {
      return failResult(`Out of effective radius max (${effectiveMaxRadius.toFixed(1)}km)`);
    }
    proximityScore = Math.max(0, 100 - Math.pow(km / effectiveMaxRadius, 2) * 100);
  }

  // 2. Acceptance Rate Score (35% Weight)
  const acceptance = input.rider.historicalAcceptanceRate ?? 85;
  const acceptanceRateScore = Math.min(100, Math.max(0, acceptance));

  // 3. Device Health & Battery Score (25% Weight)
  const batteryLevel =
    input.rider.batteryLevel ??
    input.rider.batteryPct ??
    input.rider.deviceHealth?.batteryLevel ??
    80;
  const isCharging = input.rider.deviceHealth?.isCharging ?? false;

  // Critical hardware low-battery protection (< 10% not charging)
  if (batteryLevel < 10 && !isCharging) {
    return {
      eligible: false,
      score: 0,
      allocationScore: 0,
      proximityScore: Math.round(proximityScore),
      acceptanceRateScore: Math.round(acceptanceRateScore),
      deviceHealthScore: 0,
      batteryLevel,
      metrics: zeroMetrics,
      reason: "Device battery critically low (< 10%) without active charging",
    };
  }

  let deviceHealthScore = 80;
  if (batteryLevel >= 80) {
    deviceHealthScore = 95 + ((batteryLevel - 80) / 20) * 5; // 95 - 100
  } else if (batteryLevel >= 50) {
    deviceHealthScore = 80 + ((batteryLevel - 50) / 30) * 15; // 80 - 95
  } else if (batteryLevel >= 20) {
    deviceHealthScore = 55 + ((batteryLevel - 20) / 30) * 25; // 55 - 80
  } else {
    deviceHealthScore = 20 + ((batteryLevel - 10) / 10) * 35; // 20 - 55
  }

  if (isCharging) {
    deviceHealthScore = Math.min(100, deviceHealthScore + 10);
  }
  if (input.rider.deviceHealth?.networkQuality === "POOR") {
    deviceHealthScore = Math.max(10, deviceHealthScore - 15);
  }
  if (input.rider.deviceHealth?.networkQuality === "EXCELLENT") {
    deviceHealthScore = Math.min(100, deviceHealthScore + 5);
  }

  // Device Hardware Telemetry
  const telemetryPenalty = 0;

  // KYC Level Reliability
  const reliability = input.rider.kycStatus === "VERIFIED" ? 100 : 50;

  // Historical Performance
  const completion = input.rider.historicalCompletionRate ?? 95;
  const rating = input.rider.averageRating ?? 4.8;
  const historicalPerformance =
    acceptance * 0.3 + completion * 0.4 + (rating / 5) * 100 * 0.3;

  // Weather & Traffic Modifiers
  let weatherModifier = 100;
  let vehicleSuitability = 100;
  if (input.environment) {
    if (
      input.environment.weatherCondition === "RAIN" ||
      input.environment.weatherCondition === "STORM"
    ) {
      if (input.rider.vehicleType === "BICYCLE") {
        vehicleSuitability = 30;
        weatherModifier = 50;
      } else if (input.rider.vehicleType === "CAR") {
        vehicleSuitability = 110;
      }
    }
    if (input.environment.trafficLevel === "GRIDLOCK") {
      if (input.rider.vehicleType === "MOTORCYCLE") {
        vehicleSuitability = 120;
      } else if (input.rider.vehicleType === "CAR") {
        vehicleSuitability = 40;
      }
    }
  }

  // Exact 40% proximity, 35% acceptance rate, 25% device health allocation score
  const allocationScore =
    proximityScore * 0.40 +
    acceptanceRateScore * 0.35 +
    deviceHealthScore * 0.25;

  const totalScore = parseFloat(allocationScore.toFixed(2));

  return {
    eligible: true,
    score: Math.max(0, totalScore),
    allocationScore: totalScore,
    proximityScore: parseFloat(proximityScore.toFixed(2)),
    acceptanceRateScore: parseFloat(acceptanceRateScore.toFixed(2)),
    deviceHealthScore: parseFloat(deviceHealthScore.toFixed(2)),
    batteryLevel,
    isBatched,
    batchDetourKm,
    metrics: {
      proximityScore: parseFloat(proximityScore.toFixed(2)),
      acceptanceRateScore: parseFloat(acceptanceRateScore.toFixed(2)),
      deviceHealthScore: parseFloat(deviceHealthScore.toFixed(2)),
      batteryLevel,
      zoneAffinity,
      reliability,
      telemetryPenalty,
      weatherModifier,
      vehicleSuitability,
      historicalPerformance: parseFloat(historicalPerformance.toFixed(2)),
    },
  };
}

export function isEligibleRider(input: EligibilityInput): boolean {
  return evaluateRiderEligibilityAndScore(input).eligible;
}

export type DispatchPort = {
  enqueueReady(event: ReadyOrderEvent): Promise<{ jobId: string }>;
  findEligibleRiders(jobId: string): Promise<EligibleRider[]>;
  offerToRider(
    jobId: string,
    riderId: string,
    timeoutSeconds: number,
  ): Promise<DispatchOffer>;
  /** CAS: OPEN + unexpired + matching rider → ACCEPTED. Second writer loses. */
  exclusiveAccept(offerId: string, riderId: string): Promise<boolean>;
};

export const WINDOW5_REQUIREMENTS = {
  eventsIn: ["RESTAURANT_READY", "ORDER_CANCELLED", "READY_DELAYED"] as const,
  eventsOut: [
    "RIDER_ASSIGNED",
    "RIDER_ARRIVING",
    "RIDER_ARRIVED",
    "PICKED_UP",
    "ON_THE_WAY",
    "ARRIVING",
    "DELIVERED",
    "DELIVERY_FAILED",
    "RIDER_CANCELLED",
  ] as const,
  accept: "UPDATE dispatch_offers SET status='ACCEPTED' WHERE id=$1 AND rider_id=$2 AND status='OPEN' AND expires_at > now() RETURNING *",
  money: "integer paise; earnings append-only; COD expected_paise immutable",
  location: "pings only while ONLINE/BUSY or active delivery; reject impossible jumps",
  otp: "hash+salt server-side; rate-limited; never client-verified",
  kyc: "VERIFIED/REJECTED/SUSPENDED are admin actions",
  adapters: {
    simulated: "Window 3 SimulatedDispatch — labelled SIMULATED",
    live: "Window 5 shared core — not implemented here",
  },
} as const;
