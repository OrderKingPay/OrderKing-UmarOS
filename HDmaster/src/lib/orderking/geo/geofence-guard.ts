// 1,000x Strict Geofencing & Sovereign Territory Guard for Order King & King Pay
// Enforces mandatory rule: Order King FOODS only appears where delivery is strictly active.
// Everywhere else across India, users ONLY see and experience King Pay.

export interface ActiveDeliveryZone {
  id: string;
  name: string;
  cityId: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  status: "ACTIVE" | "EXPANDING_SOON";
  description: string;
}

/**
 * Verified zones where Order King Food Delivery infrastructure is live.
 * Default flagship launch zone: Sribhumi / Karimganj core 12km radius.
 */
export const ACTIVE_DELIVERY_ZONES: ActiveDeliveryZone[] = [
  {
    id: "zone_sribhumi_core",
    name: "Sribhumi / Karimganj Central",
    cityId: "city_sribhumi",
    centerLat: 24.8688,
    centerLng: 92.3511,
    radiusKm: 12.0, // 12 km strict radius
    status: "ACTIVE",
    description: "15-minute ultra-fast sovereign delivery active with 0% surge and live rider fleet.",
  },
];

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula (km).
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 1,000x Strict Evaluation: Checks whether food delivery is legally active at the coordinates.
 * If false, the app MUST hide all food restaurants, carts, and delivery menus,
 * presenting ONLY the King Pay FinTech ecosystem.
 */
export function isDeliveryActiveInLocation(lat?: number, lng?: number, cityId?: string): boolean {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return cityId === "city_sribhumi";
  }

  for (const zone of ACTIVE_DELIVERY_ZONES) {
    if (zone.status !== "ACTIVE") continue;
    const distanceKm = calculateDistanceKm(lat, lng, zone.centerLat, zone.centerLng);
    if (distanceKm <= zone.radiusKm) {
      return true;
    }
  }

  // Backup verification by city identifier
  if (cityId === "city_sribhumi") {
    return true;
  }

  return false;
}

/**
 * Viral Expansion Waitlist & City Growth Engine for Inactive Zones
 */
export interface CityWaitlistEntry {
  cityName: string;
  waitlistVotes: number;
  trendingRank: number;
  estimatedLaunchDays: number;
}

export const EXPANSION_WAITLIST: Record<string, CityWaitlistEntry> = {
  Silchar: { cityName: "Silchar", waitlistVotes: 3420, trendingRank: 1, estimatedLaunchDays: 14 },
  Guwahati: { cityName: "Guwahati", waitlistVotes: 8910, trendingRank: 2, estimatedLaunchDays: 30 },
  Hailakandi: { cityName: "Hailakandi", waitlistVotes: 1840, trendingRank: 3, estimatedLaunchDays: 21 },
  Badarpur: { cityName: "Badarpur", waitlistVotes: 2150, trendingRank: 4, estimatedLaunchDays: 7 },
  Kolkata: { cityName: "Kolkata", waitlistVotes: 12400, trendingRank: 5, estimatedLaunchDays: 45 },
  Delhi: { cityName: "Delhi NCR", waitlistVotes: 18200, trendingRank: 6, estimatedLaunchDays: 60 },
  Mumbai: { cityName: "Mumbai", waitlistVotes: 16900, trendingRank: 7, estimatedLaunchDays: 60 },
  Bengaluru: { cityName: "Bengaluru", waitlistVotes: 15400, trendingRank: 8, estimatedLaunchDays: 60 },
};

export function getCityWaitlistInfo(cityName: string): CityWaitlistEntry {
  const match = Object.values(EXPANSION_WAITLIST).find(
    (w) => w.cityName.toLowerCase() === cityName.toLowerCase() || cityName.toLowerCase().includes(w.cityName.toLowerCase())
  );
  if (match) return match;
  return {
    cityName,
    waitlistVotes: 120,
    trendingRank: 25,
    estimatedLaunchDays: 90,
  };
}

import type { ThreatZonePolygon, PlatformSettings } from "../types";

/**
 * Standard Ray-Casting Point-in-Polygon Algorithm.
 * Returns true if [lat, lng] is strictly inside the specified polygon vertices.
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  if (!polygon || polygon.length < 3) return false;
  const [x, y] = point; // [lat, lng]
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Evaluates Indian Standard Time (IST: UTC + 5:30)
 */
export function getIstCurrentTime(now: Date = new Date()): {
  hour: number;
  minute: number;
  timeDecimal: number;
  timeString: string;
} {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  const timeDecimal = hour + minute / 60;
  const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { hour, minute, timeDecimal, timeString };
}

/**
 * Resolves current active dispatch mode and radius based on IST time of day:
 * - DAY Mode: 06:00 to 18:00 IST (default 12.0 km)
 * - EVENING_RUSH Mode: 18:00 to 22:30 IST (default 7.5 km)
 * - LATE_NIGHT Mode: 22:30 to 06:00 IST (default 3.5 km)
 */
export function resolveActiveGeofenceMode(settings: Partial<PlatformSettings>, now: Date = new Date()): {
  mode: "DAY" | "EVENING_RUSH" | "LATE_NIGHT";
  activeRadiusKm: number;
  isLateNightCodLocked: boolean;
  timeString: string;
} {
  const { timeDecimal, timeString } = getIstCurrentTime(now);

  const dayRadius = Number(settings.dayModeRadiusKm) || 12.0;
  const eveningRushRadius = Number(settings.eveningModeRadiusKm) || 7.5;
  const nightRadius = Number(settings.nightModeRadiusKm) || 3.5;
  const codLockout = settings.lateNightCodSafetyLockout ?? true;

  if (timeDecimal >= 6.0 && timeDecimal < 18.0) {
    return {
      mode: "DAY",
      activeRadiusKm: dayRadius,
      isLateNightCodLocked: false,
      timeString,
    };
  } else if (timeDecimal >= 18.0 && timeDecimal < 22.5) {
    return {
      mode: "EVENING_RUSH",
      activeRadiusKm: eveningRushRadius,
      isLateNightCodLocked: false,
      timeString,
    };
  } else {
    return {
      mode: "LATE_NIGHT",
      activeRadiusKm: nightRadius,
      isLateNightCodLocked: codLockout,
      timeString,
    };
  }
}

/**
 * Evaluates whether a destination coordinate falls within any active threat exclusion polygon.
 */
export function checkThreatZoneExclusion(
  lat: number,
  lng: number,
  threatZones: ThreatZonePolygon[] = []
): { isExcluded: boolean; matchedZone?: ThreatZonePolygon } {
  for (const zone of threatZones) {
    if (!zone.active || !zone.polygon || zone.polygon.length < 3) continue;
    if (isPointInPolygon([lat, lng], zone.polygon)) {
      return { isExcluded: true, matchedZone: zone };
    }
  }
  return { isExcluded: false };
}
