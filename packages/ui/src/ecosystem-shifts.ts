/**
 * Sovereign Quad-Core Ecosystem Shift & Threat Zone Specification
 * Council Domain 11: Connected Ecosystem Specialist
 * 
 * Synchronizes dynamic delivery radius and threat zone policies across:
 * - Customers: Dynamic availability display, quote fee engine, radius blockers.
 * - Partners: KDS active order filtering, prep radius limits, out-of-radius warnings.
 * - Riders: Shift boundaries, safety exclusion alerts, hazard telemetry, SOS dialer.
 * - Umar OS: Command center telemetry, God-Eye map, audit logs, and live telemetry feeds.
 */

export type EcosystemShiftType = "DAY" | "EVENING" | "LATE_NIGHT";

export interface EcosystemShiftConfig {
  type: EcosystemShiftType;
  name: string;
  startHour: number; // 24-hr IST
  endHour: number;   // 24-hr IST (wraps around midnight for LATE_NIGHT)
  maxRadiusKm: number;
  description: string;
  threatLevel: "NORMAL" | "ELEVATED" | "RESTRICTED";
  allowedZoneTiers: Array<"core" | "metro" | "suburban" | "safe_haven">;
}

export const ECOSYSTEM_SHIFTS: Record<EcosystemShiftType, EcosystemShiftConfig> = {
  DAY: {
    type: "DAY",
    name: "Daytime Full Metropolis Shift",
    startHour: 6,
    endHour: 18,
    maxRadiusKm: 12.0, // Founder Mandate: Day: 12km
    description: "Full municipal and suburban coverage active across all verified corridors.",
    threatLevel: "NORMAL",
    allowedZoneTiers: ["core", "metro", "suburban", "safe_haven"],
  },
  EVENING: {
    type: "EVENING",
    name: "Evening Core Urban Shift",
    startHour: 18,
    endHour: 23,
    maxRadiusKm: 7.5, // Founder Mandate: Evening: 7.5km
    description: "Peak dinner surge active. Delivery perimeter constrained to core and metro rings.",
    threatLevel: "ELEVATED",
    allowedZoneTiers: ["core", "metro", "safe_haven"],
  },
  LATE_NIGHT: {
    type: "LATE_NIGHT",
    name: "Late-Night Safe Corridor Shift",
    startHour: 23,
    endHour: 6, // 11:00 PM to 06:00 AM (wraps across midnight)
    maxRadiusKm: 3.5, // Founder Mandate: Late-Night: 3.5km
    description: "Night safety curfew active. Operations strictly limited to illuminated safe zones within 3.5km.",
    threatLevel: "RESTRICTED",
    allowedZoneTiers: ["core", "safe_haven"],
  },
};

export type ThreatLevel = "CAUTION" | "HIGH_RISK" | "EXCLUSION_CURFEW";

export interface ThreatZone {
  id: string;
  name: string;
  reason: string;
  threatLevel: ThreatLevel;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  activeShifts: EcosystemShiftType[]; // Which shifts enforce this threat exclusion
  advisoryNote: string;
}

export const CANONICAL_THREAT_ZONES: ReadonlyArray<ThreatZone> = [
  {
    id: "threat_nh_bypass_unlit",
    name: "NH-8 Unlit Highway Bypass Sector",
    reason: "Zero street lighting, heavy inter-state freight transit, high accident hazard after dusk.",
    threatLevel: "EXCLUSION_CURFEW",
    centerLat: 24.8410,
    centerLng: 92.3850,
    radiusKm: 2.2,
    activeShifts: ["EVENING", "LATE_NIGHT"],
    advisoryNote: "Bypass highway sector is unlit after 18:00 IST. Delivery routing diverted to illuminated town arterials.",
  },
  {
    id: "threat_kushiyara_flood_embankment",
    name: "Kushiyara River Low-Lying Embankment",
    reason: "Seasonal waterlogging, broken unpaved embankment road, unlit river crossing.",
    threatLevel: "HIGH_RISK",
    centerLat: 24.8820,
    centerLng: 92.3250,
    radiusKm: 1.8,
    activeShifts: ["DAY", "EVENING", "LATE_NIGHT"],
    advisoryNote: "Active embankment road hazard. Riders must maintain <20 km/h speed and use vehicle high-beam lights.",
  },
  {
    id: "threat_outer_border_perimeter",
    name: "International Border Buffer Zone (Zero Line)",
    reason: "Statutory BSF security curfew zone after 20:00 IST. Strict security exclusion.",
    threatLevel: "EXCLUSION_CURFEW",
    centerLat: 24.8950,
    centerLng: 92.3680,
    radiusKm: 2.5,
    activeShifts: ["EVENING", "LATE_NIGHT"],
    advisoryNote: "Strict border security curfew active. Order acceptance disabled in this perimeter.",
  },
  {
    id: "threat_badarpur_ghat_steep",
    name: "Badarpur Ghat Steep Incline Corridor",
    reason: "Unlit hairpin turns, steep gradient, zero cellphone connectivity in ravine.",
    threatLevel: "EXCLUSION_CURFEW",
    centerLat: 24.9050,
    centerLng: 92.4200,
    radiusKm: 2.0,
    activeShifts: ["LATE_NIGHT"],
    advisoryNote: "Late-night curfew exclusion. Deliveries over the ghat incline suspended between 23:00 and 06:00 IST.",
  },
];

/**
 * Calculates great circle distance between two points in km using Haversine formula
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Computes current Indian Standard Time (IST, UTC+5:30)
 */
export function getCurrentIstTime(date: Date = new Date()): {
  istDate: Date;
  hour: number;
  minutes: number;
  formattedTime: string;
} {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);
  const hour = istDate.getHours();
  const minutes = istDate.getMinutes();
  const hh = hour.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return { istDate, hour, minutes, formattedTime: `${hh}:${mm} IST` };
}

/**
 * Returns current ecosystem shift configuration based on IST time
 * - DAY: 06:00 to 18:00 (12.0 km)
 * - EVENING: 18:00 to 23:00 (7.5 km)
 * - LATE_NIGHT: 23:00 to 06:00 (3.5 km)
 */
export function getCurrentEcosystemShift(date: Date = new Date()): EcosystemShiftConfig {
  const { hour } = getCurrentIstTime(date);
  if (hour >= 23 || hour < 6) {
    return ECOSYSTEM_SHIFTS.LATE_NIGHT;
  }
  if (hour >= 18 && hour < 23) {
    return ECOSYSTEM_SHIFTS.EVENING;
  }
  return ECOSYSTEM_SHIFTS.DAY;
}

/**
 * Calculates remaining minutes until the current shift transitions
 */
export function getShiftRemainingMinutes(date: Date = new Date()): number {
  const { hour, minutes } = getCurrentIstTime(date);
  const currentTotalMins = hour * 60 + minutes;

  if (hour >= 6 && hour < 18) {
    // Day shift ends at 18:00 (1080 mins)
    return 18 * 60 - currentTotalMins;
  } else if (hour >= 18 && hour < 23) {
    // Evening shift ends at 23:00 (1380 mins)
    return 23 * 60 - currentTotalMins;
  } else {
    // Late night shift ends at 06:00 (360 mins)
    if (hour >= 23) {
      // Before midnight: minutes until 24:00 + 6 hours
      return (24 * 60 - currentTotalMins) + (6 * 60);
    } else {
      // After midnight: minutes until 06:00
      return 6 * 60 - currentTotalMins;
    }
  }
}

/**
 * Validates whether an order delivery distance is allowed under the current shift
 */
export function isDistanceAllowedForShift(
  distanceKm: number,
  date: Date = new Date()
): {
  allowed: boolean;
  shift: EcosystemShiftConfig;
  maxRadiusKm: number;
  reason?: string;
  blockerCode?: "EXCEEDS_MAX_RADIUS" | "EVENING_DISTANCE_LIMIT" | "NIGHT_SAFETY_CURFEW";
} {
  const shift = getCurrentEcosystemShift(date);
  const allowed = distanceKm <= shift.maxRadiusKm;
  if (allowed) {
    return { allowed: true, shift, maxRadiusKm: shift.maxRadiusKm };
  }

  let blockerCode: "EXCEEDS_MAX_RADIUS" | "EVENING_DISTANCE_LIMIT" | "NIGHT_SAFETY_CURFEW" = "EXCEEDS_MAX_RADIUS";
  if (shift.type === "EVENING") blockerCode = "EVENING_DISTANCE_LIMIT";
  if (shift.type === "LATE_NIGHT") blockerCode = "NIGHT_SAFETY_CURFEW";

  return {
    allowed: false,
    shift,
    maxRadiusKm: shift.maxRadiusKm,
    blockerCode,
    reason: `Delivery distance (${distanceKm.toFixed(1)} km) exceeds active ${shift.name} boundary (${shift.maxRadiusKm} km).`,
  };
}

/**
 * Evaluates whether a location intersects any active threat or exclusion zones
 */
export function checkThreatZoneIntersections(
  lat: number,
  lng: number,
  date: Date = new Date()
): ThreatZone[] {
  const shift = getCurrentEcosystemShift(date);
  return CANONICAL_THREAT_ZONES.filter((zone) => {
    if (!zone.activeShifts.includes(shift.type)) return false;
    const distanceKm = calculateHaversineKm(lat, lng, zone.centerLat, zone.centerLng);
    return distanceKm <= zone.radiusKm;
  });
}

export interface RiderSafetyEvaluation {
  shift: EcosystemShiftConfig;
  maxRadiusKm: number;
  remainingShiftMinutes: number;
  inThreatZone: boolean;
  activeThreatZones: ThreatZone[];
  isCurfewExclusion: boolean;
  orderAllowed: boolean;
  rejectionReason?: string;
}

/**
 * Comprehensive safety & shift check for riders and dispatchers
 */
export function evaluateRiderSafetyZone(
  riderLat: number,
  riderLng: number,
  orderDistanceKm?: number,
  date: Date = new Date()
): RiderSafetyEvaluation {
  const shift = getCurrentEcosystemShift(date);
  const remainingShiftMinutes = getShiftRemainingMinutes(date);
  const activeThreatZones = checkThreatZoneIntersections(riderLat, riderLng, date);
  const inThreatZone = activeThreatZones.length > 0;
  const isCurfewExclusion = activeThreatZones.some((z) => z.threatLevel === "EXCLUSION_CURFEW");

  let orderAllowed = true;
  let rejectionReason: string | undefined;

  if (orderDistanceKm !== undefined && orderDistanceKm > shift.maxRadiusKm) {
    orderAllowed = false;
    rejectionReason = `Order distance ${orderDistanceKm.toFixed(1)}km exceeds ${shift.name} safety cap (${shift.maxRadiusKm}km).`;
  } else if (isCurfewExclusion) {
    orderAllowed = false;
    rejectionReason = `Location inside statutory safety exclusion zone: ${activeThreatZones.map((z) => z.name).join(", ")}.`;
  }

  return {
    shift,
    maxRadiusKm: shift.maxRadiusKm,
    remainingShiftMinutes,
    inThreatZone,
    activeThreatZones,
    isCurfewExclusion,
    orderAllowed,
    rejectionReason,
  };
}
