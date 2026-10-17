/**
 * Sovereign Fleet Safety & Offline Handover Engine
 * Council Domain 6: Rider Fleet Safety, Low Battery Optimization & Doorstep Verification.
 */

import { createHash, timingSafeEqual } from "node:crypto";

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
  const signature = createHash("sha256")
    .update(`ORDERKING:${cleanOrderId}:${cleanOtp}:${timestamp}`)
    .digest("hex")
    .slice(0, 16);

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

    const expectedSig = createHash("sha256")
      .update(`ORDERKING:${data.orderId}:${data.otp}:${data.timestamp}`)
      .digest("hex")
      .slice(0, 16);

    if (data.signature !== expectedSig) {
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
      const computedHash = createHash("sha256")
        .update(`${params.expectedSalt}:${rawOtp}`)
        .digest("hex");

      if (
        computedHash.length === params.expectedHash.length &&
        timingSafeEqual(Buffer.from(computedHash), Buffer.from(params.expectedHash))
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
}
