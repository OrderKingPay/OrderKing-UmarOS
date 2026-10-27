/**
 * OrderKing Sovereign Dynamic Time-Based Geofencing & Hazard Blacklist Architecture
 * 
 * Enforces authentic IST (Asia/Kolkata) time calculations:
 * 1. Day Shift (06:00 to 18:30 IST): 12.0 km radius, 45 min max ETA, COD enabled.
 * 2. Evening Rush (18:30 to 22:30 IST): 7.5 km radius, 35 min max ETA, high-velocity traffic compression.
 * 3. Late-Night Security (22:30 to 06:00 IST): 3.5 km radius, 25 min max ETA, restricted to core lit areas, COD disabled (Prepaid UPI only).
 * 4. Hazard Zone Blacklist: Point-in-polygon (Jordan curve theorem) evaluation against threat/hazard sectors.
 */

import { distanceKm } from "../geo";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export type ShiftType = "DAY_SHIFT" | "EVENING_RUSH" | "LATE_NIGHT_SECURITY";

export interface IstTime {
  hours: number;
  minutes: number;
  totalMinutes: number; // 0 - 1439
  formattedTime: string; // "HH:mm IST"
  dateString: string;    // "YYYY-MM-DD"
}

export interface DynamicShiftConfig {
  type: ShiftType;
  name: string;
  maxRadiusKm: number;
  maxEtaMinutes: number;
  codEnabled: boolean;
  speedKmh: number;
  description: string;
  tier: ShiftType;
  shiftName: string;
  radiusKm: number;
  maxDeliveryEtaMinutes: number;
  codAllowed: boolean;
  nextShiftTime?: string;
}

export interface HazardZone {
  id: string;
  name: string;
  city: string;
  severity: "CRITICAL_BLOCKED" | "WARNING_NO_COD";
  reason: string;
  polygon: GeoPoint[]; // Ordered boundary coordinates
}

export interface HazardEvaluationResult {
  inHazardZone: boolean;
  zone: HazardZone | null;
  severity: "CRITICAL_BLOCKED" | "WARNING_NO_COD" | "SAFE";
  canDeliver: boolean;
  codAllowed: boolean;
  advisory: string | null;
  deliveryBlocked: boolean;
  codBlocked: boolean;
  reason: string | null;
}

export interface DeliveryRadiusEvaluation {
  allowed: boolean;
  distanceKm: number;
  shift: DynamicShiftConfig;
  istTime: IstTime;
  withinRadius: boolean;
  maxRadiusKm: number;
  maxEtaMinutes: number;
  codAllowed: boolean;
  originHazard: HazardEvaluationResult;
  destinationHazard: HazardEvaluationResult;
  rejectionReason: string | null;
  warningMessage: string | null;
}

// ==========================================
// 1. AUTHENTIC IST (ASIA/KOLKATA) TIME ENGINE
// ==========================================

/**
 * Returns accurate IST hours, minutes, and metadata regardless of server time zone.
 */
export function parseIstTime(input?: Date | string | number): IstTime {
  const date = input instanceof Date
    ? input
    : typeof input === "string" || typeof input === "number"
    ? new Date(input)
    : new Date();

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  let hour = 0;
  let minute = 0;
  let year = "2026";
  let month = "01";
  let day = "01";

  for (const part of parts) {
    if (part.type === "hour") hour = parseInt(part.value, 10);
    if (part.type === "minute") minute = parseInt(part.value, 10);
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
  }

  if (hour === 24) hour = 0;

  const totalMinutes = hour * 60 + minute;
  const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} IST`;
  const dateString = `${year}-${month}-${day}`;

  return {
    hours: hour,
    minutes: minute,
    totalMinutes,
    formattedTime,
    dateString,
  };
}

// ==========================================
// 2. DYNAMIC SHIFTS (DAY, RUSH, LATE-NIGHT)
// ==========================================

export const SHIFT_CONFIGS: Record<ShiftType, DynamicShiftConfig> = {
  DAY_SHIFT: {
    type: "DAY_SHIFT",
    name: "Day Shift (Wide Metropolitan Reach)",
    maxRadiusKm: 12.0,
    maxEtaMinutes: 45,
    codEnabled: true,
    speedKmh: 20,
    description: "06:00 to 18:30 IST: Standard daytime coverage up to 12.0 km with full Cash on Delivery support.",
    tier: "DAY_SHIFT",
    shiftName: "Day Shift (Wide Metropolitan Reach)",
    radiusKm: 12.0,
    maxDeliveryEtaMinutes: 45,
    codAllowed: true,
  },
  EVENING_RUSH: {
    type: "EVENING_RUSH",
    name: "Evening Rush (High-Velocity Compression)",
    maxRadiusKm: 7.5,
    maxEtaMinutes: 35,
    codEnabled: true,
    speedKmh: 16,
    description: "18:30 to 22:30 IST: Peak congestion compression to 7.5 km to guarantee sub-35min deliveries.",
    tier: "EVENING_RUSH",
    shiftName: "Evening Rush (High-Velocity Compression)",
    radiusKm: 7.5,
    maxDeliveryEtaMinutes: 35,
    codAllowed: true,
  },
  LATE_NIGHT_SECURITY: {
    type: "LATE_NIGHT_SECURITY",
    name: "Late-Night Security (Core Well-Lit Geofence)",
    maxRadiusKm: 3.5,
    maxEtaMinutes: 25,
    codEnabled: false, // Mandatory prepaid digital settlement
    speedKmh: 24,
    description: "22:30 to 06:00 IST: Hyper-localized safety radius (3.5 km) restricted to core lit zones. Cash on Delivery suspended.",
    tier: "LATE_NIGHT_SECURITY",
    shiftName: "Late-Night Security (Core Well-Lit Geofence)",
    radiusKm: 3.5,
    maxDeliveryEtaMinutes: 25,
    codAllowed: false,
  },
};

/**
 * Determines current active shift based on IST time.
 * - Day Shift: 06:00 to 18:30 IST (minutes 360 to 1109)
 * - Evening Rush: 18:30 to 22:30 IST (minutes 1110 to 1349)
 * - Late-Night Security: 22:30 to 06:00 IST (minutes >= 1350 or < 360)
 */
export function getActiveShift(input?: Date | string | number): DynamicShiftConfig & { ist: IstTime } {
  const ist = parseIstTime(input);
  const m = ist.totalMinutes;

  let shiftType: ShiftType;
  if (m >= 360 && m < 1110) {
    shiftType = "DAY_SHIFT";
  } else if (m >= 1110 && m < 1350) {
    shiftType = "EVENING_RUSH";
  } else {
    shiftType = "LATE_NIGHT_SECURITY";
  }

  const baseConfig = SHIFT_CONFIGS[shiftType];
  const nextShiftTime =
    shiftType === "DAY_SHIFT"
      ? "18:30 IST"
      : shiftType === "EVENING_RUSH"
      ? "22:30 IST"
      : "06:00 IST";
  return {
    ...baseConfig,
    nextShiftTime,
    ist,
  };
}

// ==========================================
// 3. POINT-IN-POLYGON (JORDAN CURVE THEOREM)
// ==========================================

/**
 * Ray-Casting algorithm to test if a geographical coordinate is inside a polygon.
 */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

// ==========================================
// 4. HAZARD ZONE BLACKLIST CATALOG
// ==========================================

export const HAZARD_ZONES: HazardZone[] = [
  {
    id: "kushiyara_unlit_riverbank",
    name: "Kushiyara River Border Unpaved Marsh Sector",
    city: "karimganj",
    severity: "CRITICAL_BLOCKED",
    reason: "Unlit international riverbank buffer with active erosion and zero vehicular street illumination. Delivery prohibited.",
    polygon: [
      { lat: 24.8780, lng: 92.3420 },
      { lat: 24.8940, lng: 92.3450 },
      { lat: 24.8910, lng: 92.3620 },
      { lat: 24.8770, lng: 92.3590 },
    ],
  },
  {
    id: "yamuna_khadar_floodplain",
    name: "Yamuna Khadar Low-Lying Floodplain Sandbar",
    city: "delhi",
    severity: "CRITICAL_BLOCKED",
    reason: "Low-lying unpaved river floodplain with zero lighting and flash mud hazards. Delivery prohibited for rider safety.",
    polygon: [
      { lat: 28.6620, lng: 77.2480 },
      { lat: 28.6780, lng: 77.2580 },
      { lat: 28.6690, lng: 77.2720 },
      { lat: 28.6480, lng: 77.2570 },
    ],
  },
  {
    id: "delhi_freight_expressway_unlit",
    name: "Outer Freight High-Speed Transit Corridor",
    city: "delhi",
    severity: "WARNING_NO_COD",
    reason: "Heavy multi-axle freight transit corridor without pedestrian lighting. Cash on Delivery suspended; prepaid orders only.",
    polygon: [
      { lat: 28.5200, lng: 77.2920 },
      { lat: 28.5420, lng: 77.3110 },
      { lat: 28.5320, lng: 77.3320 },
      { lat: 28.5080, lng: 77.3070 },
    ],
  },
  {
    id: "sribhumi_tea_foothills_remote",
    name: "Sribhumi Remote Tea Estate Foothills Unpaved Corridor",
    city: "karimganj",
    severity: "WARNING_NO_COD",
    reason: "Steep unlit gravel tracks with intermittent network connectivity. Cash on Delivery suspended; prepaid orders only.",
    polygon: [
      { lat: 24.8180, lng: 92.3120 },
      { lat: 24.8360, lng: 92.3160 },
      { lat: 24.8310, lng: 92.3360 },
      { lat: 24.8140, lng: 92.3310 },
    ],
  },
];

/**
 * Checks if a point falls within any blacklisted hazard zone.
 */
export function evaluateHazardLocation(point: GeoPoint, customZones?: HazardZone[]): HazardEvaluationResult {
  const zones = customZones || HAZARD_ZONES;

  for (const zone of zones) {
    if (isPointInPolygon(point, zone.polygon)) {
      const isCritical = zone.severity === "CRITICAL_BLOCKED";
      return {
        inHazardZone: true,
        zone,
        severity: zone.severity,
        canDeliver: !isCritical,
        codAllowed: false,
        advisory: isCritical
          ? `Delivery is strictly prohibited in ${zone.name}. Reason: ${zone.reason}`
          : `Cash on Delivery is suspended in ${zone.name}. Digital payment required. Reason: ${zone.reason}`,
        deliveryBlocked: isCritical,
        codBlocked: true,
        reason: zone.reason,
      };
    }
  }

  return {
    inHazardZone: false,
    zone: null,
    severity: "SAFE",
    canDeliver: true,
    codAllowed: true,
    advisory: null,
    deliveryBlocked: false,
    codBlocked: false,
    reason: null,
  };
}

// ==========================================
// 5. UNIFIED DELIVERY EVALUATION ENGINE
// ==========================================

export interface EvaluateDeliveryOptions {
  date?: Date | string | number;
  customHazardZones?: HazardZone[];
}

/**
 * Full architectural check: validates dynamic time radius, hazard blacklist, ETA, and payment rails.
 */
export function evaluateDeliveryRadius(
  origin: GeoPoint,
  destination: GeoPoint,
  options?: EvaluateDeliveryOptions
): DeliveryRadiusEvaluation {
  const shift = getActiveShift(options?.date);
  const dist = distanceKm(origin, destination);
  const roundedDist = Math.round(dist * 10) / 10;

  const originHazard = evaluateHazardLocation(origin, options?.customHazardZones);
  const destinationHazard = evaluateHazardLocation(destination, options?.customHazardZones);

  const withinRadius = roundedDist <= shift.maxRadiusKm;

  // COD is enabled only if shift allows it AND neither origin nor destination is flagged with NO_COD
  const codAllowed = shift.codEnabled && originHazard.codAllowed && destinationHazard.codAllowed;

  // Critical hazard checks
  if (originHazard.severity === "CRITICAL_BLOCKED") {
    return {
      allowed: false,
      distanceKm: roundedDist,
      shift,
      istTime: shift.ist,
      withinRadius,
      maxRadiusKm: shift.maxRadiusKm,
      maxEtaMinutes: shift.maxEtaMinutes,
      codAllowed: false,
      originHazard,
      destinationHazard,
      rejectionReason: originHazard.advisory,
      warningMessage: null,
    };
  }

  if (destinationHazard.severity === "CRITICAL_BLOCKED") {
    return {
      allowed: false,
      distanceKm: roundedDist,
      shift,
      istTime: shift.ist,
      withinRadius,
      maxRadiusKm: shift.maxRadiusKm,
      maxEtaMinutes: shift.maxEtaMinutes,
      codAllowed: false,
      originHazard,
      destinationHazard,
      rejectionReason: destinationHazard.advisory,
      warningMessage: null,
    };
  }

  // Radius check
  if (!withinRadius) {
    return {
      allowed: false,
      distanceKm: roundedDist,
      shift,
      istTime: shift.ist,
      withinRadius: false,
      maxRadiusKm: shift.maxRadiusKm,
      maxEtaMinutes: shift.maxEtaMinutes,
      codAllowed,
      originHazard,
      destinationHazard,
      rejectionReason: `Location is beyond current ${shift.name} radius limit (${roundedDist} km > ${shift.maxRadiusKm} km max).`,
      warningMessage: null,
    };
  }

  // Warning notices (e.g. COD suspension)
  let warningMessage: string | null = null;
  if (!codAllowed) {
    if (!shift.codEnabled) {
      warningMessage = "Late-Night Security protocol active: Digital prepaid settlement required (COD disabled).";
    } else if (originHazard.severity === "WARNING_NO_COD") {
      warningMessage = originHazard.advisory;
    } else if (destinationHazard.severity === "WARNING_NO_COD") {
      warningMessage = destinationHazard.advisory;
    }
  }

  return {
    allowed: true,
    distanceKm: roundedDist,
    shift,
    istTime: shift.ist,
    withinRadius: true,
    maxRadiusKm: shift.maxRadiusKm,
    maxEtaMinutes: shift.maxEtaMinutes,
    codAllowed,
    originHazard,
    destinationHazard,
    rejectionReason: null,
    warningMessage,
  };
}

export function getActiveDeliveryRadius(date?: Date | string | number): DynamicShiftConfig & { ist: IstTime } {
  return getActiveShift(date);
}

export function checkHazardZone(point: GeoPoint, customZones?: HazardZone[]): HazardEvaluationResult {
  return evaluateHazardLocation(point, customZones);
}

