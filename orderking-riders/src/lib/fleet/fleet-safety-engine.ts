/**
 * Sovereign Fleet Safety & Offline Handover Engine
 * Council Domain 6: Rider Fleet Safety, Low Battery Optimization & Doorstep Verification.
 */

import { sha256Hex, safeTimingSafeEqual } from "@/lib/rider/crypto-util";
import { haversineKm } from "@/lib/rider/eta";
import type { GeoPoint } from "@/lib/rider/types";

export const STANDARD_GPS_INTERVAL_MS = 3_000; // 3 seconds standard
export const LOW_BATTERY_GPS_INTERVAL_MS = 10_000; // 10 seconds power saver (<20% battery)
export const LOW_BATTERY_THRESHOLD = 0.20; // 20%
export const MAX_QR_CODE_AGE_MS = 5 * 60 * 1000; // 5 minutes validity

export interface BatteryState {
  level: number; // 0.0 to 1.0 (e.g. 0.15 = 15%)
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

export interface FleetPowerProfile {
  isLowBattery: boolean;
  gpsIntervalMs: number;
  disableNonEssentialAnimations: boolean;
  powerSaveMode: boolean;
  batteryLevelPercent: number;
  statusDescription: string;
}

export interface DoorstepVerificationResult {
  success: boolean;
  method: "OTP" | "QR" | null;
  verifiedAt: string;
  error?: string;
  orderId: string;
}

export interface DynamicDeliveryQrData {
  prefix: "ORDERKING_DOORSTEP_QR";
  version: number;
  orderId: string;
  otp: string;
  timestamp: number;
  signature: string;
}

export const STATUTORY_SAFETY_HELPLINES = {
  NATIONAL_EMERGENCY: {
    number: "112",
    label: "112 · National Emergency & Police SOS",
    telUri: "tel:112",
    service: "POLICE_AND_CIVIL_PROTECTION",
  },
  AMBULANCE: {
    number: "108",
    label: "108 · Medical Emergency & Ambulance",
    telUri: "tel:108",
    service: "AMBULANCE",
  },
  POLICE: {
    number: "100",
    label: "100 · Police Control Room",
    telUri: "tel:100",
    service: "POLICE",
  },
  FLEET_SAFETY_HELPLINE: {
    number: "18001000",
    label: "1800-100-ORDER · OrderKing 24x7 Fleet Command Desk",
    telUri: "tel:18001000",
    service: "FLEET_OPERATIONS",
  },
} as const;

export type SafetyHelplineKey = keyof typeof STATUTORY_SAFETY_HELPLINES;

export interface SosDialerResult {
  incidentId: string;
  targetNumber: string;
  telUri: string;
  timestamp: number;
  lat: number;
  lng: number;
  deliveryId: string | null;
  riderId: string | null;
  googleMapsPinUrl: string;
  distressSummary: string;
  offlineLogged: boolean;
}

/**
 * Computes adaptive power profile based on device battery level and charging state.
 * When battery is under 20% and not charging:
 * - Drops GPS ping frequency from 3s to 10s
 * - Disables non-essential animations to preserve battery for doorstep verification
 */
export function computePowerProfile(battery: {
  level: number;
  charging?: boolean;
}): FleetPowerProfile {
  const level = Number.isFinite(battery.level) ? Math.max(0, Math.min(1, battery.level)) : 1.0;
  const charging = Boolean(battery.charging);
  const batteryLevelPercent = Math.round(level * 100);

  const isLowBattery = level < LOW_BATTERY_THRESHOLD && !charging;

  if (isLowBattery) {
    return {
      isLowBattery: true,
      gpsIntervalMs: LOW_BATTERY_GPS_INTERVAL_MS,
      disableNonEssentialAnimations: true,
      powerSaveMode: true,
      batteryLevelPercent,
      statusDescription: `Low Battery Mode Active (${batteryLevelPercent}%): GPS cadence dropped to 10s and non-essential UI animations disabled to preserve doorstep shift power.`,
    };
  }

  return {
    isLowBattery: false,
    gpsIntervalMs: STANDARD_GPS_INTERVAL_MS,
    disableNonEssentialAnimations: false,
    powerSaveMode: false,
    batteryLevelPercent,
    statusDescription: `Optimal Fleet Power (${batteryLevelPercent}%${charging ? ", Charging" : ""}): GPS operating at high-accuracy 3s cadence with full animations.`,
  };
}

/**
 * Generate a dynamic cryptographic QR payload displayed on the customer's OrderKing app.
 */
export function generateDynamicDeliveryQr(
  orderId: string,
  otp: string,
  timestamp: number = Date.now(),
): string {
  const cleanOrderId = orderId.trim();
  const cleanOtp = otp.trim();
  const signature = sha256Hex(`ORDERKING:${cleanOrderId}:${cleanOtp}:${timestamp}`).slice(0, 16);

  const data: DynamicDeliveryQrData = {
    prefix: "ORDERKING_DOORSTEP_QR",
    version: 1,
    orderId: cleanOrderId,
    otp: cleanOtp,
    timestamp,
    signature,
  };

  return JSON.stringify(data);
}

/**
 * Validates dynamic delivery QR code payload.
 * Verifies authenticity, order match, and 5-minute expiry window.
 */
export function verifyDynamicDeliveryQr(
  rawPayload: string,
  expectedOrderId: string,
  expectedOtp: string,
  maxAgeMs: number = MAX_QR_CODE_AGE_MS,
): { valid: boolean; reason?: string } {
  try {
    const data = JSON.parse(rawPayload.trim()) as DynamicDeliveryQrData;
    if (data.prefix !== "ORDERKING_DOORSTEP_QR") {
      return { valid: false, reason: "INVALID_QR_FORMAT: Unrecognized payload signature" };
    }

    if (data.orderId !== expectedOrderId.trim()) {
      return { valid: false, reason: "ORDER_MISMATCH: Scanned QR does not belong to active delivery" };
    }

    if (data.otp !== expectedOtp.trim()) {
      return { valid: false, reason: "OTP_MISMATCH: Customer handover code does not match order record" };
    }

    const age = Date.now() - data.timestamp;
    if (age < 0 || age > maxAgeMs) {
      return { valid: false, reason: "QR_EXPIRED: Dynamic handover QR code has expired. Ask customer to refresh." };
    }

    const expectedSig = sha256Hex(`ORDERKING:${data.orderId}:${data.otp}:${data.timestamp}`).slice(0, 16);

    if (!safeTimingSafeEqual(data.signature, expectedSig)) {
      return { valid: false, reason: "TAMPERED_QR: Cryptographic signature mismatch" };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "MALFORMED_QR_PAYLOAD" };
  }
}

/**
 * Doorstep Delivery Verification: Supports 4-digit OTP OR dynamic customer QR code scan.
 */
export function verifyDoorstepDelivery(params: {
  orderId: string;
  enteredOtp?: string | null;
  qrPayload?: string | null;
  expectedOtp: string;
  expectedSalt?: string | null;
  expectedHash?: string | null;
  maxQrAgeMs?: number;
}): DoorstepVerificationResult {
  const verifiedAt = new Date().toISOString();
  const cleanExpectedOtp = params.expectedOtp.trim();

  // 1. Method: Dynamic QR Code Scan
  if (params.qrPayload && params.qrPayload.trim().length > 0) {
    const qrCheck = verifyDynamicDeliveryQr(
      params.qrPayload,
      params.orderId,
      cleanExpectedOtp,
      params.maxQrAgeMs,
    );
    if (qrCheck.valid) {
      return {
        success: true,
        method: "QR",
        verifiedAt,
        orderId: params.orderId,
      };
    }
    return {
      success: false,
      method: "QR",
      verifiedAt,
      error: qrCheck.reason || "QR verification failed",
      orderId: params.orderId,
    };
  }

  // 2. Method: Customer 4-digit OTP Manual Entry
  if (params.enteredOtp !== undefined && params.enteredOtp !== null) {
    const rawOtp = params.enteredOtp.trim();

    if (!/^\d{4}$/.test(rawOtp)) {
      return {
        success: false,
        method: "OTP",
        verifiedAt,
        error: "OTP must be exactly 4 numeric digits",
        orderId: params.orderId,
      };
    }

    // Direct plain OTP match
    if (rawOtp === cleanExpectedOtp) {
      return {
        success: true,
        method: "OTP",
        verifiedAt,
        orderId: params.orderId,
      };
    }

    // Hash & Salt verification if provided
    if (params.expectedSalt && params.expectedHash) {
      const computedHash = sha256Hex(`${params.expectedSalt}:${rawOtp}`);

      if (
        computedHash.length === params.expectedHash.length &&
        safeTimingSafeEqual(computedHash, params.expectedHash)
      ) {
        return {
          success: true,
          method: "OTP",
          verifiedAt,
          orderId: params.orderId,
        };
      }
    }

    return {
      success: false,
      method: "OTP",
      verifiedAt,
      error: "INCORRECT_OTP: Handover PIN does not match customer record",
      orderId: params.orderId,
    };
  }

  return {
    success: false,
    method: null,
    verifiedAt,
    error: "MISSING_VERIFICATION_CREDENTIALS: Must provide either 4-digit OTP or scanned dynamic QR payload",
    orderId: params.orderId,
  };
}

/**
 * 1-Tap SOS Safety Dialer: Direct bridge to 112 / Ambulance / Fleet Safety Helpline.
 */
export function triggerSosSafetyDialer(
  targetKey: "112" | "108" | "100" | "FLEET",
  context: {
    lat: number;
    lng: number;
    deliveryId?: string | null;
    riderId?: string | null;
    note?: string;
  },
): SosDialerResult {
  const timestamp = Date.now();
  const incidentId = `SOS-${timestamp.toString().slice(-6)}`;
  const lat = Number(context.lat) || 28.6315;
  const lng = Number(context.lng) || 77.2167;

  let targetNumber = "112";
  let targetLabel = "National Emergency 112";

  if (targetKey === "108") {
    targetNumber = STATUTORY_SAFETY_HELPLINES.AMBULANCE.number;
    targetLabel = STATUTORY_SAFETY_HELPLINES.AMBULANCE.label;
  } else if (targetKey === "100") {
    targetNumber = STATUTORY_SAFETY_HELPLINES.POLICE.number;
    targetLabel = STATUTORY_SAFETY_HELPLINES.POLICE.label;
  } else if (targetKey === "FLEET") {
    targetNumber = STATUTORY_SAFETY_HELPLINES.FLEET_SAFETY_HELPLINE.number;
    targetLabel = STATUTORY_SAFETY_HELPLINES.FLEET_SAFETY_HELPLINE.label;
  } else {
    targetNumber = STATUTORY_SAFETY_HELPLINES.NATIONAL_EMERGENCY.number;
    targetLabel = STATUTORY_SAFETY_HELPLINES.NATIONAL_EMERGENCY.label;
  }

  const telUri = `tel:${targetNumber}`;
  const googleMapsPinUrl = `https://www.google.com/maps?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  const distressSummary = `🚨 EMERGENCY BEACON (${incidentId}): Direct dialer bridge initiated to ${targetLabel} (${targetNumber}). GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}${context.deliveryId ? ` · Order #${context.deliveryId}` : ""}`;

  return {
    incidentId,
    targetNumber,
    telUri,
    timestamp,
    lat,
    lng,
    deliveryId: context.deliveryId ?? null,
    riderId: context.riderId ?? null,
    googleMapsPinUrl,
    distressSummary,
    offlineLogged: true,
  };
}

/**
 * FleetSafetyEngine Singleton Class
 * Manages low-battery state, adaptive GPS heartbeat interval, and doorstep security.
 */
export class FleetSafetyEngine {
  private static instance: FleetSafetyEngine | null = null;
  private powerProfile: FleetPowerProfile;
  private incidentLog: SosDialerResult[] = [];

  private constructor() {
    this.powerProfile = computePowerProfile({ level: 1.0, charging: true });
  }

  public static getInstance(): FleetSafetyEngine {
    if (!FleetSafetyEngine.instance) {
      FleetSafetyEngine.instance = new FleetSafetyEngine();
    }
    return FleetSafetyEngine.instance;
  }

  public getPowerProfile(): FleetPowerProfile {
    return this.powerProfile;
  }

  public updateBatteryStatus(battery: { level: number; charging?: boolean }): FleetPowerProfile {
    this.powerProfile = computePowerProfile(battery);
    return this.powerProfile;
  }

  public getGpsPingIntervalMs(): number {
    return this.powerProfile.gpsIntervalMs;
  }

  public shouldDisableAnimations(): boolean {
    return this.powerProfile.disableNonEssentialAnimations;
  }

  public verifyHandover(params: {
    orderId: string;
    enteredOtp?: string | null;
    qrPayload?: string | null;
    expectedOtp: string;
    expectedSalt?: string | null;
    expectedHash?: string | null;
  }): DoorstepVerificationResult {
    return verifyDoorstepDelivery(params);
  }

  public triggerSos(
    target: "112" | "108" | "100" | "FLEET",
    context: {
      lat: number;
      lng: number;
      deliveryId?: string | null;
      riderId?: string | null;
      note?: string;
    },
  ): SosDialerResult {
    const result = triggerSosSafetyDialer(target, context);
    this.incidentLog.unshift(result);
    return result;
  }

  public getIncidentLog(): SosDialerResult[] {
    return [...this.incidentLog];
  }

  public getShiftRadius(dateOrHour?: Date | number): ShiftRadiusRule {
    return getDynamicShiftRadius(dateOrHour);
  }

  public evaluateThreatZone(
    destination: GeoPoint,
    threatZones?: ThreatZone[],
  ): ThreatZoneEvaluation {
    return evaluateThreatZoneRisk(destination, threatZones);
  }

  public getTwoWheelerNavigationLinks(
    point: GeoPoint,
    label?: string,
  ): TwoWheelerNavigationLinks {
    return buildTwoWheelerNavigationLinks(point, label);
  }
}

// ─────────────────────────────────────────────────────────────
// 5. DYNAMIC TIME-OF-DAY SHIFT RADII (DAY 12km / EVE 7.5km / LATE-NIGHT 3.5km)
// ─────────────────────────────────────────────────────────────
export type ShiftWindow = "DAY" | "EVENING" | "LATE_NIGHT";

export interface ShiftRadiusRule {
  shift: ShiftWindow;
  startHour: number;
  endHour: number;
  maxRadiusKm: number;
  label: string;
  rationale: string;
}

export const DYNAMIC_SHIFT_RADII: Record<ShiftWindow, ShiftRadiusRule> = {
  DAY: {
    shift: "DAY",
    startHour: 6,
    endHour: 19,
    maxRadiusKm: 12.0,
    label: "Day Shift (06:00 - 19:00)",
    rationale: "Standard high-velocity operating radius for daylight traffic conditions (12.0km)",
  },
  EVENING: {
    shift: "EVENING",
    startHour: 19,
    endHour: 23,
    maxRadiusKm: 7.5,
    label: "Evening Peak (19:00 - 23:00)",
    rationale: "Congestion and fatigue mitigation radius limit (7.5km)",
  },
  LATE_NIGHT: {
    shift: "LATE_NIGHT",
    startHour: 23,
    endHour: 6,
    maxRadiusKm: 3.5,
    label: "Late-Night Defense (23:00 - 06:00)",
    rationale: "Fatigue mitigation and anti-robbery perimeter restriction for nocturnal shifts (3.5km)",
  },
};

/**
 * Resolves the active dynamic shift radius based on local time or specified hour.
 * - Day (06:00 - 19:00): 12.0 km
 * - Evening (19:00 - 23:00): 7.5 km
 * - Late-Night (23:00 - 06:00): 3.5 km
 */
export function getDynamicShiftRadius(dateOrHour: Date | number = new Date()): ShiftRadiusRule {
  const hour = typeof dateOrHour === "number" ? dateOrHour : dateOrHour.getHours();
  if (hour >= 6 && hour < 19) {
    return DYNAMIC_SHIFT_RADII.DAY;
  }
  if (hour >= 19 && hour < 23) {
    return DYNAMIC_SHIFT_RADII.EVENING;
  }
  return DYNAMIC_SHIFT_RADII.LATE_NIGHT;
}

// ─────────────────────────────────────────────────────────────
// 6. THREAT-ZONE EXCLUSION & HAZARD LOCKDOWN
// ─────────────────────────────────────────────────────────────
export type ThreatZonePolicy = "BLOCK_ORDER" | "LOCK_COD_ONLINE_ONLY";

export interface ThreatZone {
  id: string;
  name: string;
  center: GeoPoint;
  radiusMeters: number;
  riskLevel: "HIGH" | "CRITICAL";
  policy: ThreatZonePolicy;
  reason: string;
}

export interface ThreatZoneEvaluation {
  isThreatZone: boolean;
  zone: ThreatZone | null;
  orderBlocked: boolean;
  codLocked: boolean;
  distanceToCenterMeters: number | null;
  policyEnforced: ThreatZonePolicy | "SAFE";
  rationale: string;
}

export const REGISTERED_THREAT_ZONES: ThreatZone[] = [
  {
    id: "TZ_UNLIT_HIGHWAY_CORRIDOR",
    name: "Isolated Outer Ring Road Cut",
    center: { lat: 28.7041, lng: 77.1025 },
    radiusMeters: 1500,
    riskLevel: "CRITICAL",
    policy: "BLOCK_ORDER",
    reason: "Zero streetlight coverage, repeated violent two-wheeler hijackings reported. Delivery prohibited.",
  },
  {
    id: "TZ_HIGH_DISPUTE_SLUM_POCKET",
    name: "Industrial Canal Border Pocket",
    center: { lat: 19.1136, lng: 72.8697 },
    radiusMeters: 1200,
    riskLevel: "HIGH",
    policy: "LOCK_COD_ONLINE_ONLY",
    reason: "History of physical intimidation and cash robbery during doorstep COD delivery. Mandatory prepaid online payment.",
  },
  {
    id: "TZ_RAILWAY_DEADEND_UNDERPASS",
    name: "Marshy Railway Dead-End Underpass",
    center: { lat: 12.9352, lng: 77.6245 },
    radiusMeters: 800,
    riskLevel: "HIGH",
    policy: "LOCK_COD_ONLINE_ONLY",
    reason: "Narrow dead-end alley with zero escape route. Cash-on-Delivery locked to safeguard courier.",
  },
];

/**
 * Evaluates whether a destination coordinate falls within any registered threat or hazard zones.
 * If in CRITICAL zone: blocks the order from being dispatched.
 * If in HIGH risk zone: enforces LOCK_COD_ONLINE_ONLY to eliminate robbery incentives.
 */
export function evaluateThreatZoneRisk(
  destination?: GeoPoint | null,
  threatZones: ThreatZone[] = REGISTERED_THREAT_ZONES,
): ThreatZoneEvaluation {
  const destLat = Number(destination?.lat) || 0;
  const destLng = Number(destination?.lng) || 0;
  if (!destLat && !destLng) {
    return {
      isThreatZone: false,
      zone: null,
      orderBlocked: false,
      codLocked: false,
      distanceToCenterMeters: null,
      policyEnforced: "SAFE",
      rationale: "No destination coordinates provided; default standard safety perimeter applies.",
    };
  }

  for (const zone of threatZones) {
    const distKm = haversineKm({ lat: destLat, lng: destLng }, zone.center);
    const distMeters = Math.round(distKm * 1000);

    if (distMeters <= zone.radiusMeters) {
      const isCritical = zone.riskLevel === "CRITICAL" || zone.policy === "BLOCK_ORDER";
      return {
        isThreatZone: true,
        zone,
        orderBlocked: isCritical,
        codLocked: true, // COD is locked on both CRITICAL and HIGH
        distanceToCenterMeters: distMeters,
        policyEnforced: zone.policy,
        rationale: `Threat Zone Triggered (${zone.name}, ${distMeters}m from epicenter): ${zone.reason}`,
      };
    }
  }

  return {
    isThreatZone: false,
    zone: null,
    orderBlocked: false,
    codLocked: false,
    distanceToCenterMeters: null,
    policyEnforced: "SAFE",
    rationale: "Destination is clear of registered threat hazard zones.",
  };
}

// ─────────────────────────────────────────────────────────────
// 7. NATIVE TWO-WHEELER GOOGLE MAPS NAVIGATION DEEP LINKS
// ─────────────────────────────────────────────────────────────
export interface TwoWheelerNavigationLinks {
  androidIntentUri: string;
  geoUri: string;
  webUrl: string;
}

/**
 * Builds native two-wheeler Google Maps navigation deep links:
 * - androidIntentUri: `google.navigation:q=${lat},${lng}&mode=b` (mode=b for two-wheeler)
 * - geoUri: `geo:${lat},${lng}?q=${lat},${lng}&mode=b`
 * - webUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=two-wheeler`
 */
export function buildTwoWheelerNavigationLinks(
  point?: GeoPoint | null,
  label = "Destination",
): TwoWheelerNavigationLinks {
  const lat = Number(point?.lat) || 0;
  const lng = Number(point?.lng) || 0;
  return {
    androidIntentUri: `google.navigation:q=${lat},${lng}&mode=b`,
    geoUri: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})&mode=b`,
    webUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=two-wheeler`,
  };
}
