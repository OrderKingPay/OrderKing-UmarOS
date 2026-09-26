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
};

export type EligibilityInput = {
  rider: EligibleRider;
  dataMode: DataMode;
  hasActiveDelivery: boolean;
  hasOpenOffer: boolean;
  pickup: GeoPoint;
  restaurantArea: string;
  maxRadiusKm: number;
  environment?: {
    weatherCondition: "CLEAR" | "RAIN" | "STORM" | "FOG";
    trafficLevel: "LOW" | "MODERATE" | "HIGH" | "GRIDLOCK";
    timeOfDay: "MORNING" | "MIDDAY" | "RUSH_HOUR" | "LATE_NIGHT";
  };
};

/**
 * Eligibility and Advanced AI Dispatch Scoring are server-side.
 * LIVE duty requires VERIFIED KYC. One active job in the pilot.
 */
export type DispatchScoreDetails = {
  eligible: boolean;
  score: number;
  metrics: {
    proximityScore: number;
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
  const zeroMetrics = { proximityScore: 0, zoneAffinity: 0, reliability: 0, telemetryPenalty: 0, weatherModifier: 0, vehicleSuitability: 0, historicalPerformance: 0 };
  
  if (input.rider.status !== "ONLINE") return { eligible: false, score: 0, metrics: zeroMetrics, reason: "Not ONLINE" };
  if (input.hasActiveDelivery) return { eligible: false, score: 0, metrics: zeroMetrics, reason: "Active delivery exists" };
  if (input.hasOpenOffer) return { eligible: false, score: 0, metrics: zeroMetrics, reason: "Has open offer" };
  if (input.dataMode === "LIVE" && input.rider.kycStatus !== "VERIFIED") return { eligible: false, score: 0, metrics: zeroMetrics, reason: "Not verified for LIVE" };

  let zoneAffinity = 0;
  if (input.rider.preferredZones.length > 0) {
    const zoneOk = input.rider.preferredZones.some(
      (z) => z.toLowerCase() === input.restaurantArea.toLowerCase(),
    );
    // In extreme high traffic, zone affinity strictness can be ignored, but normally it's required
    const isDesperate = input.environment?.trafficLevel === "GRIDLOCK" || input.environment?.weatherCondition === "STORM";
    if (!zoneOk && !isDesperate) {
      return { eligible: false, score: 0, metrics: zeroMetrics, reason: "Out of preferred zone" };
    }
    if (zoneOk) zoneAffinity = 100;
    else zoneAffinity = 20; // Allowed due to desperation but penalized
  }

  // Adjust max radius based on vehicle and weather
  let effectiveMaxRadius = input.maxRadiusKm;
  if (input.rider.vehicleType === "BICYCLE") effectiveMaxRadius = Math.min(3, input.maxRadiusKm);
  if (input.environment?.weatherCondition === "STORM") effectiveMaxRadius *= 0.7; // Shrink radius in storm
  
  let proximityScore = 50; 
  if (input.rider.lastPoint) {
    const km = haversineKm(input.rider.lastPoint, input.pickup);
    if (km > effectiveMaxRadius) return { eligible: false, score: 0, metrics: zeroMetrics, reason: `Out of effective radius max (${effectiveMaxRadius.toFixed(1)}km)` };
    // Exponential decay score for distance
    proximityScore = Math.max(0, 100 - Math.pow(km / effectiveMaxRadius, 2) * 100);
  }

  // Simulated IoT Telemetry: Battery & Network Drops
  const simulatedBattery = Math.random() * 100;
  const telemetryPenalty = simulatedBattery < 15 ? -50 : 0;

  // KYC Level Reliability
  const reliability = input.rider.kycStatus === "VERIFIED" ? 100 : 50;

  // Historical Performance (AI Predictive Quality)
  const acceptance = input.rider.historicalAcceptanceRate ?? 85;
  const completion = input.rider.historicalCompletionRate ?? 95;
  const rating = input.rider.averageRating ?? 4.8;
  const historicalPerformance = (acceptance * 0.3) + (completion * 0.4) + ((rating / 5) * 100 * 0.3);

  // Weather & Traffic Modifiers
  let weatherModifier = 100;
  let vehicleSuitability = 100;
  if (input.environment) {
    if (input.environment.weatherCondition === "RAIN" || input.environment.weatherCondition === "STORM") {
      if (input.rider.vehicleType === "BICYCLE") {
         vehicleSuitability = 30; // Very unsafe/slow for bicycles
         weatherModifier = 50;
      } else if (input.rider.vehicleType === "CAR") {
         vehicleSuitability = 110; // Better protected
      }
    }
    if (input.environment.trafficLevel === "GRIDLOCK") {
      if (input.rider.vehicleType === "MOTORCYCLE") {
         vehicleSuitability = 120; // Can weave through traffic
      } else if (input.rider.vehicleType === "CAR") {
         vehicleSuitability = 40; // Will get stuck
      }
    }
  }

  // Deep Learning Emulated Weighted Score Calculation
  const totalScore = (proximityScore * 0.35) 
                   + (zoneAffinity * 0.15) 
                   + (historicalPerformance * 0.20) 
                   + (vehicleSuitability * 0.15)
                   + (weatherModifier * 0.10)
                   + (reliability * 0.05) 
                   + telemetryPenalty;

  return {
    eligible: true,
    score: Math.max(0, totalScore),
    metrics: { proximityScore, zoneAffinity, reliability, telemetryPenalty, weatherModifier, vehicleSuitability, historicalPerformance }
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
