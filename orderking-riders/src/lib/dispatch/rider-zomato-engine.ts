// File: orderking-riders/src/lib/dispatch/rider-zomato-engine.ts
// Exact Zomato Delivery Partner Parity:
// - Floating Trip Offer Radar (45s countdown, distance, item count, guaranteed payout)
// - Smart Dual-Order Corridor Batching (Max 2 active orders along same route corridor)
// - Mandatory 4-Digit Customer Delivery OTP Gate (ON_THE_WAY -> DELIVERED)
// - Distance-based Pay (Rs 15/km base + rain/late-night surge + 100% customer tips)
// - Daily COD Cash Deposit Ledger with UPI QR (orderking@ybl & 9395065587@ybl)
// - Shift Perimeters (Day: 12km, Evening: 7.5km, Late-Night: 3.5km) & SOS Beacon

export type RiderShiftType = 'DAY' | 'EVENING' | 'LATE_NIGHT';
export type RiderOrderState =
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ARRIVED_AT_KITCHEN'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED';

export const RIDER_SHIFT_PERIMETERS_KM: Record<RiderShiftType, number> = {
  DAY: 12.0,       // 06:00 - 18:00 IST
  EVENING: 7.5,    // 18:00 - 23:00 IST
  LATE_NIGHT: 3.5, // 23:00 - 06:00 IST
} as const;

export const RIDER_PAYOUT_CONSTANTS = {
  BASE_RATE_PER_KM_PAISE: 1500, // Rs 15.00 / km
  MINIMUM_BASE_PAY_PAISE: 3000, // Rs 30.00 minimum guaranteed base
  RAIN_SURGE_PAISE: 1500,       // Rs 15.00 rain bonus
  LATE_NIGHT_SURGE_PAISE: 2000, // Rs 20.00 late-night bonus
  OFFER_COUNTDOWN_SECONDS: 45,  // 45-second floating trip offer radar countdown
  MAX_CORRIDOR_BATCH_ORDERS: 2, // Max 2 active orders per rider
  MAX_CORRIDOR_ANGLE_DEG: 25,   // Max 25 deg bearing deviation for corridor batching
  MAX_COD_CASH_IN_HAND_PAISE: 250000, // Rs 2,500 COD ceiling
  PRIMARY_UPI_VPA: 'orderking@ybl',
  SECONDARY_UPI_VPA: '9395065587@ybl',
} as const;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RiderTripOfferRadar {
  offerId: string;
  orderId: string;
  restaurantName: string;
  pickupLocation: GeoPoint;
  dropLocation: GeoPoint;
  pickupDistanceKm: number;
  dropDistanceKm: number;
  totalDistanceKm: number;
  itemCount: number;
  countdownSeconds: number;
  expiresAtMs: number;
  payoutBreakdown: {
    distancePayPaise: number;
    rainSurgePaise: number;
    lateNightSurgePaise: number;
    customerTipPaise: number;
    guaranteedTotalPayoutPaise: number;
  };
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateHaversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Number((R * c).toFixed(2));
}

/**
 * Computes initial compass bearing (0-360 deg) from point A to point B.
 */
export function calculateBearingDegrees(a: GeoPoint, b: GeoPoint): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Resolves the active shift and maximum delivery radius (12km Day / 7.5km Evening / 3.5km Late-Night)
 * based on Indian Standard Time (IST).
 */
export function resolveActiveShiftAndPerimeter(nowMs: number = Date.now()): {
  shift: RiderShiftType;
  maxRadiusKm: number;
} {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const istHour = new Date(nowMs + IST_OFFSET_MS).getUTCHours();
  if (istHour >= 6 && istHour < 18) {
    return { shift: 'DAY', maxRadiusKm: RIDER_SHIFT_PERIMETERS_KM.DAY };
  }
  if (istHour >= 18 && istHour < 23) {
    return { shift: 'EVENING', maxRadiusKm: RIDER_SHIFT_PERIMETERS_KM.EVENING };
  }
  return { shift: 'LATE_NIGHT', maxRadiusKm: RIDER_SHIFT_PERIMETERS_KM.LATE_NIGHT };
}

/**
 * Builds a Floating Trip Offer Radar payload with a strict 45-second countdown
 * and guaranteed integer-paise payout breakdown (Rs 15/km base + rain/late-night surge + 100% tips).
 */
export function buildFloatingTripOfferRadar(params: {
  offerId: string;
  orderId: string;
  restaurantName: string;
  riderLocation: GeoPoint;
  pickupLocation: GeoPoint;
  dropLocation: GeoPoint;
  itemCount: number;
  isRaining: boolean;
  isLateNight: boolean;
  customerTipPaise: number;
  nowMs?: number;
}): RiderTripOfferRadar {
  const now = params.nowMs ?? Date.now();
  const pickupDistanceKm = calculateHaversineKm(params.riderLocation, params.pickupLocation);
  const dropDistanceKm = calculateHaversineKm(params.pickupLocation, params.dropLocation);
  const totalDistanceKm = Number((pickupDistanceKm + dropDistanceKm).toFixed(2));

  const rawDistancePaise = Math.round(totalDistanceKm * RIDER_PAYOUT_CONSTANTS.BASE_RATE_PER_KM_PAISE);
  const distancePayPaise = Math.max(RIDER_PAYOUT_CONSTANTS.MINIMUM_BASE_PAY_PAISE, rawDistancePaise);
  const rainSurgePaise = params.isRaining ? RIDER_PAYOUT_CONSTANTS.RAIN_SURGE_PAISE : 0;
  const lateNightSurgePaise = params.isLateNight ? RIDER_PAYOUT_CONSTANTS.LATE_NIGHT_SURGE_PAISE : 0;
  const customerTipPaise = Math.max(0, Math.trunc(params.customerTipPaise));

  return {
    offerId: params.offerId,
    orderId: params.orderId,
    restaurantName: params.restaurantName,
    pickupLocation: params.pickupLocation,
    dropLocation: params.dropLocation,
    pickupDistanceKm,
    dropDistanceKm,
    totalDistanceKm,
    itemCount: params.itemCount,
    countdownSeconds: RIDER_PAYOUT_CONSTANTS.OFFER_COUNTDOWN_SECONDS,
    expiresAtMs: now + RIDER_PAYOUT_CONSTANTS.OFFER_COUNTDOWN_SECONDS * 1000,
    payoutBreakdown: {
      distancePayPaise,
      rainSurgePaise,
      lateNightSurgePaise,
      customerTipPaise,
      guaranteedTotalPayoutPaise:
        distancePayPaise + rainSurgePaise + lateNightSurgePaise + customerTipPaise,
    },
  };
}

/**
 * Smart Dual-Order Corridor Batching Engine:
 * Allows a maximum of 2 active orders along the same directional route corridor
 * (pickup proximity <= 1.5km and drop bearing delta <= 25 degrees).
 */
export function evaluateDualOrderCorridorBatching(params: {
  activeOrders: ReadonlyArray<{
    orderId: string;
    pickupLocation: GeoPoint;
    dropLocation: GeoPoint;
  }>;
  candidateOrder: {
    orderId: string;
    pickupLocation: GeoPoint;
    dropLocation: GeoPoint;
  };
}): {
  canBatch: boolean;
  reason: string;
  bearingDeltaDegrees?: number;
  pickupGapKm?: number;
} {
  if (params.activeOrders.length >= RIDER_PAYOUT_CONSTANTS.MAX_CORRIDOR_BATCH_ORDERS) {
    return {
      canBatch: false,
      reason: `Rider already holds maximum ${RIDER_PAYOUT_CONSTANTS.MAX_CORRIDOR_BATCH_ORDERS} active orders.`,
    };
  }
  if (params.activeOrders.length === 0) {
    return {
      canBatch: true,
      reason: 'Rider has 0 active orders; primary order assigned.',
    };
  }

  const primary = params.activeOrders[0];
  const pickupGapKm = calculateHaversineKm(primary.pickupLocation, params.candidateOrder.pickupLocation);
  if (pickupGapKm > 1.5) {
    return {
      canBatch: false,
      pickupGapKm,
      reason: `Candidate kitchen is ${pickupGapKm}km away from primary pickup (exceeds 1.5km corridor limit).`,
    };
  }

  const primaryBearing = calculateBearingDegrees(primary.pickupLocation, primary.dropLocation);
  const candidateBearing = calculateBearingDegrees(
    params.candidateOrder.pickupLocation,
    params.candidateOrder.dropLocation
  );
  const rawDiff = Math.abs(primaryBearing - candidateBearing) % 360;
  const bearingDeltaDegrees = Number((rawDiff > 180 ? 360 - rawDiff : rawDiff).toFixed(2));

  if (bearingDeltaDegrees > RIDER_PAYOUT_CONSTANTS.MAX_CORRIDOR_ANGLE_DEG) {
    return {
      canBatch: false,
      pickupGapKm,
      bearingDeltaDegrees,
      reason: `Corridor bearing deviation ${bearingDeltaDegrees}° exceeds ${RIDER_PAYOUT_CONSTANTS.MAX_CORRIDOR_ANGLE_DEG}° maximum.`,
    };
  }

  return {
    canBatch: true,
    pickupGapKm,
    bearingDeltaDegrees,
    reason: 'Second order matches route corridor within 1.5km pickup and <=25° bearing.',
  };
}

/**
 * Mandatory 4-Digit Customer Delivery OTP Gate:
 * Strictly gates transitioning an order from ON_THE_WAY to DELIVERED.
 */
export function verifyMandatoryCustomerDeliveryOtp(params: {
  orderId: string;
  currentState: RiderOrderState;
  expected4DigitOtp: string;
  submittedOtp: string;
  failedAttempts: number;
}): {
  verified: boolean;
  nextState: RiderOrderState;
  reason?: string;
} {
  if (params.currentState !== 'ON_THE_WAY') {
    return {
      verified: false,
      nextState: params.currentState,
      reason: `Order ${params.orderId} must be in ON_THE_WAY state before delivery OTP verification (current: ${params.currentState}).`,
    };
  }
  if (params.failedAttempts >= 5) {
    return {
      verified: false,
      nextState: params.currentState,
      reason: 'Maximum 5 OTP attempts exceeded. Contact UmarOS Operations Support.',
    };
  }
  const cleanSubmitted = (params.submittedOtp || '').trim();
  if (!/^\d{4}$/.test(cleanSubmitted) || cleanSubmitted !== params.expected4DigitOtp) {
    return {
      verified: false,
      nextState: params.currentState,
      reason: 'Incorrect 4-digit customer delivery OTP.',
    };
  }
  return {
    verified: true,
    nextState: 'DELIVERED',
  };
}

/**
 * Generates an official UPI Deposit Deep-Link & QR URI for daily COD settlement
 * to `orderking@ybl` (with fallback `9395065587@ybl`).
 */
export function buildRiderCodDepositUpiUri(params: {
  riderId: string;
  cashInHandPaise: number;
  useSecondaryVpa?: boolean;
}): {
  upiUri: string;
  vpa: string;
  amountInr: string;
  isBlockedFromNewCod: boolean;
} {
  const vpa = params.useSecondaryVpa
    ? RIDER_PAYOUT_CONSTANTS.SECONDARY_UPI_VPA
    : RIDER_PAYOUT_CONSTANTS.PRIMARY_UPI_VPA;
  const amountInr = (Math.max(0, params.cashInHandPaise) / 100).toFixed(2);
  const note = encodeURIComponent(`OrderKing COD Settlement ${params.riderId}`);
  const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent('OrderKing Technologies')}&am=${amountInr}&cu=INR&tn=${note}`;

  return {
    upiUri,
    vpa,
    amountInr,
    isBlockedFromNewCod: params.cashInHandPaise >= RIDER_PAYOUT_CONSTANTS.MAX_COD_CASH_IN_HAND_PAISE,
  };
}