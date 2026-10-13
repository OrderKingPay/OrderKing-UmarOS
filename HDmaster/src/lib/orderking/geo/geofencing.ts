/**
 * OrderKing Sovereign Geospatial Engine & Dynamic Serviceability Framework
 * UMAR OS & OrderKing Sovereign Logistics Core
 *
 * Implements:
 * 1. Ray-Casting Point-in-Polygon (PIP) with complex polygon & GeoJSON support.
 * 2. Haversine distance, bearing, and boundary projection algorithms.
 * 3. Dynamic time-based serviceability engine with:
 *    - Daytime schedule (06:00 to 18:00 - wide city coverage)
 *    - Evening schedule (18:00 to 22:00 - core urban zones)
 *    - Late-night schedule (22:00 to 04:00 - safe zones only, with midnight wrap-around)
 *    - Day of week overrides and shift rollover
 *    - Emergency weather / road restriction freezes and zone exclusions.
 */

// ==========================================
// 1. Core Types & Interfaces
// ==========================================

export interface LatLng {
  lat: number;
  lng: number;
}

export type LatLngTuple = [lat: number, lng: number]; // [lat, lng] format
export type GeoJSONPosition = [lng: number, lat: number]; // GeoJSON [longitude, latitude]

export interface PolygonRings {
  outer: LatLng[];
  holes?: LatLng[][];
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: GeoJSONPosition[][];
}

export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: GeoJSONPosition[][][];
}

export interface GeoJSONFeature<
  G = GeoJSONPolygon | GeoJSONMultiPolygon,
  P = Record<string, unknown>
> {
  type: "Feature";
  geometry: G;
  properties?: P;
}

export type PolygonDefinition =
  | LatLng[]
  | LatLngTuple[]
  | PolygonRings
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONFeature<GeoJSONPolygon | GeoJSONMultiPolygon>;

export type ZoneTier = "core" | "metro" | "suburban" | "safe_haven" | "restricted";

export type ScheduleType = "daytime" | "evening" | "late_night" | "24x7" | "custom";

export interface ServiceZone {
  id: string;
  name: string;
  tier: ZoneTier;
  polygon: PolygonDefinition;
  allowedSchedules?: (ScheduleType | string)[];
  activeDaysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  emergencyExcluded?: boolean;
  maxDeliveryRadiusKm?: number;
  metadata?: Record<string, unknown>;
}

export interface ServiceScheduleWindow {
  id: string;
  name: string;
  type: ScheduleType;
  startTime: string; // "HH:mm" (24-hour format)
  endTime: string;   // "HH:mm" (24-hour format, supports midnight rollover e.g. "04:00")
  allowedTiers?: ZoneTier[];
  allowedZoneIds?: string[];
  daysOfWeek?: number[]; // 0 = Sunday, ..., 6 = Saturday
}

export type EmergencyLevel = "YELLOW" | "ORANGE" | "RED" | "CRITICAL_FREEZE";

export interface EmergencyRestriction {
  active: boolean;
  level?: EmergencyLevel;
  freezeAllDeliveries?: boolean;
  reason?: string;
  affectedZoneIds?: string[];
  allowedZoneIds?: string[];
  effectiveUntil?: Date | string;
}

export interface ServiceabilityConfig {
  zones: ServiceZone[];
  schedules?: ServiceScheduleWindow[];
  defaultSchedule?: ScheduleType;
  emergencyOverride?: EmergencyRestriction;
  boundaryToleranceMeters?: number;
}

export type ServiceabilityReasonCode =
  | "SERVICEABLE"
  | "OUTSIDE_GEOFENCE"
  | "ZONE_INACTIVE_SCHEDULE"
  | "ZONE_DAY_RESTRICTED"
  | "EMERGENCY_FREEZE"
  | "ZONE_EMERGENCY_RESTRICTED"
  | "NO_ACTIVE_ZONES";

export interface ServiceabilityResult {
  serviceable: boolean;
  reasonCode: ServiceabilityReasonCode;
  matchedZone?: ServiceZone;
  activeSchedule?: ServiceScheduleWindow;
  currentScheduleType: ScheduleType | "closed" | "override";
  distanceToNearestZoneBoundaryKm?: number;
  nearestZone?: ServiceZone;
  isOnBoundary?: boolean;
  details: string;
  timestamp: string;
}

// ==========================================
// 2. Coordinate Conversion & Normalization
// ==========================================

export function toLatLng(point: LatLng | LatLngTuple | GeoJSONPosition, isGeoJson = false): LatLng {
  if (Array.isArray(point)) {
    if (isGeoJson) {
      // GeoJSON position: [lng, lat]
      return { lat: point[1], lng: point[0] };
    }
    // Standard tuple: [lat, lng]
    return { lat: point[0], lng: point[1] };
  }
  return { lat: point.lat, lng: point.lng };
}

/**
 * Normalizes any supported PolygonDefinition into an array of simple polygons (outer ring + holes).
 */
export function normalizePolygonDefinition(polygon: PolygonDefinition): PolygonRings[] {
  if (Array.isArray(polygon)) {
    if (polygon.length === 0) return [];
    const first = polygon[0];
    if (Array.isArray(first)) {
      // LatLngTuple[]: [lat, lng][]
      return [
        {
          outer: (polygon as LatLngTuple[]).map(([lat, lng]) => ({ lat, lng })),
        },
      ];
    } else {
      // LatLng[]: {lat, lng}[]
      return [
        {
          outer: polygon as LatLng[],
        },
      ];
    }
  }

  // Check if it's a PolygonRings structure
  if ("outer" in polygon && Array.isArray(polygon.outer)) {
    return [polygon];
  }

  // Check if GeoJSON Feature
  if ("type" in polygon && polygon.type === "Feature") {
    return normalizePolygonDefinition(polygon.geometry);
  }

  // Check if GeoJSON Polygon
  if ("type" in polygon && polygon.type === "Polygon") {
    const coords = polygon.coordinates;
    if (!coords || coords.length === 0) return [];
    const outer = coords[0].map((c) => ({ lat: c[1], lng: c[0] }));
    const holes = coords.slice(1).map((ring) => ring.map((c) => ({ lat: c[1], lng: c[0] })));
    return [{ outer, holes }];
  }

  // Check if GeoJSON MultiPolygon
  if ("type" in polygon && polygon.type === "MultiPolygon") {
    const allPolys = polygon.coordinates;
    if (!allPolys || allPolys.length === 0) return [];
    return allPolys.map((polyCoords) => {
      const outer = polyCoords[0].map((c) => ({ lat: c[1], lng: c[0] }));
      const holes = polyCoords.slice(1).map((ring) => ring.map((c) => ({ lat: c[1], lng: c[0] })));
      return { outer, holes };
    });
  }

  return [];
}

// ==========================================
// 3. Haversine Distance & Bearing Calculations
// ==========================================

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_M = 6371000;

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula.
 * @param p1 Point 1
 * @param p2 Point 2
 * @param unit 'km' or 'm' (defaults to 'km')
 */
export function haversineDistance(
  p1: LatLng | LatLngTuple,
  p2: LatLng | LatLngTuple,
  unit: "km" | "m" = "km"
): number {
  const pt1 = toLatLng(p1);
  const pt2 = toLatLng(p2);

  const R = unit === "m" ? EARTH_RADIUS_M : EARTH_RADIUS_KM;
  const toRad = Math.PI / 180;
  const dLat = (pt2.lat - pt1.lat) * toRad;
  const dLng = (pt2.lng - pt1.lng) * toRad;
  const lat1 = pt1.lat * toRad;
  const lat2 = pt2.lat * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes forward azimuth/bearing from point 1 to point 2 in degrees (0 - 360).
 */
export function calculateBearing(
  from: LatLng | LatLngTuple,
  to: LatLng | LatLngTuple
): number {
  const pt1 = toLatLng(from);
  const pt2 = toLatLng(to);

  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const lat1 = pt1.lat * toRad;
  const lat2 = pt2.lat * toRad;
  const dLng = (pt2.lng - pt1.lng) * toRad;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * toDeg;
  return (bearing + 360) % 360;
}

/**
 * Calculates perpendicular/shortest distance in meters from a point to a line segment [a, b].
 */
export function distanceToSegmentMeters(
  point: LatLng,
  a: LatLng,
  b: LatLng
): number {
  const toRad = Math.PI / 180;
  const meanLat = ((a.lat + b.lat) / 2) * toRad;
  const cosLat = Math.cos(meanLat);

  // Local flat projection coordinates in meters
  const ax = a.lng * toRad * EARTH_RADIUS_M * cosLat;
  const ay = a.lat * toRad * EARTH_RADIUS_M;
  const bx = b.lng * toRad * EARTH_RADIUS_M * cosLat;
  const by = b.lat * toRad * EARTH_RADIUS_M;
  const px = point.lng * toRad * EARTH_RADIUS_M * cosLat;
  const py = point.lat * toRad * EARTH_RADIUS_M;

  const dx = bx - ax;
  const dy = by - ay;
  const segmentLenSq = dx * dx + dy * dy;

  if (segmentLenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / segmentLenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.hypot(px - projX, py - projY);
}

// ==========================================
// 4. Point-in-Polygon (Ray-Casting Algorithm)
// ==========================================

/**
 * Checks if a point lies on the boundary edge of a polygon within tolerance in meters.
 */
export function isPointOnPolygonBoundary(
  point: LatLng | LatLngTuple,
  polygon: PolygonDefinition,
  toleranceMeters: number = 2.0
): boolean {
  const pt = toLatLng(point);
  const ringsList = normalizePolygonDefinition(polygon);

  for (const rings of ringsList) {
    const allRings = [rings.outer, ...(rings.holes || [])];
    for (const ring of allRings) {
      if (ring.length < 2) continue;
      for (let i = 0; i < ring.length; i++) {
        const j = (i + 1) % ring.length;
        const d = distanceToSegmentMeters(pt, ring[i], ring[j]);
        if (d <= toleranceMeters) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Internal single-ring Ray-Casting algorithm.
 * Casts a horizontal ray eastward (lng -> +infinity).
 */
function rayCastRing(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  const n = ring.length;
  if (n < 3) return false;

  const y = point.lat;
  const x = point.lng;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = ring[i].lat;
    const xi = ring[i].lng;
    const yj = ring[j].lat;
    const xj = ring[j].lng;

    // Check if the segment crosses the horizontal ray at latitude y
    const intersect =
      yi > y !== yj > y &&
      x < xi + ((xj - xi) * (y - yi)) / (yj - yi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Robust Point-in-Polygon (PIP) testing supporting:
 * - Simple convex & concave polygons
 * - Polygons with holes (interior rings)
 * - MultiPolygons
 * - Exact boundary detection with configurable tolerance
 */
export function isPointInPolygon(
  point: LatLng | LatLngTuple,
  polygon: PolygonDefinition,
  options: {
    includeBoundary?: boolean;
    toleranceMeters?: number;
  } = {}
): boolean {
  const { includeBoundary = true, toleranceMeters = 2.0 } = options;
  const pt = toLatLng(point);

  // Check boundary if requested
  if (includeBoundary && isPointOnPolygonBoundary(pt, polygon, toleranceMeters)) {
    return true;
  }

  const ringsList = normalizePolygonDefinition(polygon);
  if (ringsList.length === 0) return false;

  for (const rings of ringsList) {
    // 1. Must be strictly inside the outer boundary
    if (!rayCastRing(pt, rings.outer)) {
      continue;
    }

    // 2. Must NOT be inside any hole
    let inHole = false;
    if (rings.holes && rings.holes.length > 0) {
      for (const hole of rings.holes) {
        if (rayCastRing(pt, hole)) {
          inHole = true;
          break;
        }
      }
    }

    if (!inHole) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates distance from a point to the nearest boundary edge of a polygon in kilometers.
 */
export function distanceToPolygonBoundaryKm(
  point: LatLng | LatLngTuple,
  polygon: PolygonDefinition
): number {
  const pt = toLatLng(point);
  const ringsList = normalizePolygonDefinition(polygon);
  if (ringsList.length === 0) return Infinity;

  let minMeters = Infinity;

  for (const rings of ringsList) {
    const allRings = [rings.outer, ...(rings.holes || [])];
    for (const ring of allRings) {
      for (let i = 0; i < ring.length; i++) {
        const j = (i + 1) % ring.length;
        const d = distanceToSegmentMeters(pt, ring[i], ring[j]);
        if (d < minMeters) {
          minMeters = d;
        }
      }
    }
  }

  return minMeters === Infinity ? Infinity : minMeters / 1000;
}

// ==========================================
// 5. Dynamic Time & Schedule Evaluation
// ==========================================

export function parseMinutesOfDay(timeStr: string): number {
  const parts = timeStr.split(":").map((v) => parseInt(v.trim(), 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

/**
 * Checks if a specific time is within a schedule window.
 * Supports midnight wrap-around (e.g. 22:00 to 04:00).
 */
export function isTimeInWindow(
  date: Date,
  startTime: string,
  endTime: string
): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMin = parseMinutesOfDay(startTime);
  const endMin = parseMinutesOfDay(endTime);

  if (startMin === endMin) {
    return true; // 24-hour continuous window
  }

  if (endMin > startMin) {
    // Normal single-day window (e.g. 06:00 to 18:00)
    return currentMinutes >= startMin && currentMinutes < endMin;
  } else {
    // Midnight wrap-around window (e.g. 22:00 to 04:00)
    return currentMinutes >= startMin || currentMinutes < endMin;
  }
}

/**
 * Determines whether the current schedule shift spans midnight and originated on the previous day.
 */
export function isOvernightRollover(
  date: Date,
  startTime: string,
  endTime: string
): boolean {
  const startMin = parseMinutesOfDay(startTime);
  const endMin = parseMinutesOfDay(endTime);
  if (endMin >= startMin) return false;

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  // It is past midnight and before the morning cutoff
  return currentMinutes < endMin;
}

// Default standard schedules for OrderKing
export const DEFAULT_SCHEDULE_WINDOWS: ServiceScheduleWindow[] = [
  {
    id: "schedule_daytime",
    name: "Daytime Full Metropolis Coverage",
    type: "daytime",
    startTime: "06:00",
    endTime: "18:00",
    allowedTiers: ["core", "metro", "suburban", "safe_haven"],
  },
  {
    id: "schedule_evening",
    name: "Evening Core Urban Fleet",
    type: "evening",
    startTime: "18:00",
    endTime: "22:00",
    allowedTiers: ["core", "metro", "safe_haven"],
  },
  {
    id: "schedule_late_night",
    name: "Late-Night Sovereign Safe Zones",
    type: "late_night",
    startTime: "22:00",
    endTime: "04:00", // Midnight wrap-around to 4 AM
    allowedTiers: ["core", "safe_haven"],
  },
];

// Default sovereign zones centered on Sribhumi / Karimganj
export const DEFAULT_SOVEREIGN_ZONES: ServiceZone[] = [
  {
    id: "zone_sribhumi_core",
    name: "Karimganj / Sribhumi Central Hub",
    tier: "core",
    polygon: [
      { lat: 24.8788, lng: 92.3411 },
      { lat: 24.8788, lng: 92.3651 },
      { lat: 24.8588, lng: 92.3651 },
      { lat: 24.8588, lng: 92.3411 },
    ],
    allowedSchedules: ["daytime", "evening", "late_night", "24x7"],
    maxDeliveryRadiusKm: 5.0,
  },
  {
    id: "zone_sribhumi_metro",
    name: "Greater Sribhumi Metro Ring",
    tier: "metro",
    polygon: [
      { lat: 24.8988, lng: 92.3211 },
      { lat: 24.8988, lng: 92.3851 },
      { lat: 24.8388, lng: 92.3851 },
      { lat: 24.8388, lng: 92.3211 },
    ],
    allowedSchedules: ["daytime", "evening"],
    maxDeliveryRadiusKm: 10.0,
  },
  {
    id: "zone_sribhumi_suburban",
    name: "Sribhumi Suburban Outskirts",
    tier: "suburban",
    polygon: [
      { lat: 24.9288, lng: 92.2911 },
      { lat: 24.9288, lng: 92.4151 },
      { lat: 24.8088, lng: 92.4151 },
      { lat: 24.8088, lng: 92.2911 },
    ],
    allowedSchedules: ["daytime"],
    maxDeliveryRadiusKm: 15.0,
  },
  {
    id: "zone_sribhumi_safe_haven",
    name: "Karimganj Civil Hospital & Emergency Corridor",
    tier: "safe_haven",
    polygon: [
      { lat: 24.872, lng: 92.345 },
      { lat: 24.872, lng: 92.355 },
      { lat: 24.865, lng: 92.355 },
      { lat: 24.865, lng: 92.345 },
    ],
    allowedSchedules: ["daytime", "evening", "late_night", "24x7"],
  },
];

// ==========================================
// 6. Primary Serviceability Engine
// ==========================================

/**
 * Master serviceability assessment evaluating:
 * 1. Global emergency freeze & restrictions.
 * 2. Active schedule window (Daytime, Evening, Late-Night with midnight rollover).
 * 3. Day of week permissions.
 * 4. Geofence containment via Ray-Casting.
 * 5. Zone schedule & tier permissions.
 * 6. Zone-level emergency exclusions.
 */
export function isServiceable(
  point: LatLng | LatLngTuple,
  currentTime: Date,
  config: ServiceabilityConfig
): ServiceabilityResult {
  const pt = toLatLng(point);
  const now = currentTime || new Date();
  const timestamp = now.toISOString();
  const toleranceMeters = config.boundaryToleranceMeters ?? 2.0;

  const schedules = config.schedules && config.schedules.length > 0
    ? config.schedules
    : DEFAULT_SCHEDULE_WINDOWS;

  const zones = config.zones || [];

  // --- Step 1: Check Global Emergency Freeze ---
  if (config.emergencyOverride?.active) {
    if (config.emergencyOverride.freezeAllDeliveries) {
      return {
        serviceable: false,
        reasonCode: "EMERGENCY_FREEZE",
        currentScheduleType: "override",
        details:
          config.emergencyOverride.reason ||
          "Emergency dispatch freeze active across all zones due to severe weather/curfew.",
        timestamp,
      };
    }
  }

  // --- Step 2: Determine Active Schedule Window ---
  let activeSchedule: ServiceScheduleWindow | undefined;

  for (const schedule of schedules) {
    if (isTimeInWindow(now, schedule.startTime, schedule.endTime)) {
      // Check schedule-level days of week if specified
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        const currentDay = now.getDay();
        const isRollover = isOvernightRollover(now, schedule.startTime, schedule.endTime);
        const shiftOriginDay = (currentDay + 6) % 7;

        const dayAllowed =
          schedule.daysOfWeek.includes(currentDay) ||
          (isRollover && schedule.daysOfWeek.includes(shiftOriginDay));

        if (!dayAllowed) {
          continue;
        }
      }

      activeSchedule = schedule;
      break;
    }
  }

  const currentScheduleType: ScheduleType | "closed" = activeSchedule
    ? activeSchedule.type
    : (config.defaultSchedule || "closed");

  if (!activeSchedule && currentScheduleType === "closed") {
    return {
      serviceable: false,
      reasonCode: "ZONE_INACTIVE_SCHEDULE",
      currentScheduleType: "closed",
      details: "No active delivery schedule available for the current time window.",
      timestamp,
    };
  }

  if (zones.length === 0) {
    return {
      serviceable: false,
      reasonCode: "NO_ACTIVE_ZONES",
      currentScheduleType,
      details: "No delivery geofence zones are configured in the system.",
      timestamp,
    };
  }

  // --- Step 3: Match Point Against Geofence Zones ---
  let containingZone: ServiceZone | undefined;
  let nearestZone: ServiceZone | undefined;
  let minDistanceKm = Infinity;
  let pointOnBoundary = false;

  for (const zone of zones) {
    const onBoundary = isPointOnPolygonBoundary(pt, zone.polygon, toleranceMeters);
    const inside = onBoundary || isPointInPolygon(pt, zone.polygon, {
      includeBoundary: true,
      toleranceMeters,
    });

    if (inside && !containingZone) {
      containingZone = zone;
      pointOnBoundary = onBoundary;
    }

    // Track nearest zone for helpful driver/customer feedback
    const distToBoundary = distanceToPolygonBoundaryKm(pt, zone.polygon);
    if (distToBoundary < minDistanceKm) {
      minDistanceKm = distToBoundary;
      nearestZone = zone;
    }
  }

  // Point is outside all defined polygons
  if (!containingZone) {
    return {
      serviceable: false,
      reasonCode: "OUTSIDE_GEOFENCE",
      currentScheduleType,
      activeSchedule,
      nearestZone,
      distanceToNearestZoneBoundaryKm: Math.round(minDistanceKm * 100) / 100,
      details: nearestZone
        ? `Location is outside service territory. Nearest active zone is "${nearestZone.name}" (~${minDistanceKm.toFixed(2)} km away).`
        : "Location is outside all serviceable geofences.",
      timestamp,
    };
  }

  // --- Step 4: Verify Zone Day of Week Eligibility ---
  if (containingZone.activeDaysOfWeek && containingZone.activeDaysOfWeek.length > 0) {
    const currentDay = now.getDay();
    const isRollover = activeSchedule
      ? isOvernightRollover(now, activeSchedule.startTime, activeSchedule.endTime)
      : false;
    const shiftOriginDay = (currentDay + 6) % 7;

    const dayAllowed =
      containingZone.activeDaysOfWeek.includes(currentDay) ||
      (isRollover && containingZone.activeDaysOfWeek.includes(shiftOriginDay));

    if (!dayAllowed) {
      return {
        serviceable: false,
        reasonCode: "ZONE_DAY_RESTRICTED",
        matchedZone: containingZone,
        activeSchedule,
        currentScheduleType,
        details: `Zone "${containingZone.name}" does not operate on day ${currentDay}.`,
        timestamp,
      };
    }
  }

  // --- Step 5: Verify Zone-level Emergency Exclusions ---
  if (config.emergencyOverride?.active) {
    const isExcluded =
      containingZone.emergencyExcluded ||
      config.emergencyOverride.affectedZoneIds?.includes(containingZone.id);

    const isExplicitlyAllowed = config.emergencyOverride.allowedZoneIds
      ? config.emergencyOverride.allowedZoneIds.includes(containingZone.id)
      : true;

    if (isExcluded || !isExplicitlyAllowed) {
      return {
        serviceable: false,
        reasonCode: "ZONE_EMERGENCY_RESTRICTED",
        matchedZone: containingZone,
        activeSchedule,
        currentScheduleType,
        details: `Zone "${containingZone.name}" is temporarily suspended under emergency directive: ${config.emergencyOverride.reason || "Localized restriction"}.`,
        timestamp,
      };
    }
  }

  // --- Step 6: Verify Zone Schedule & Tier Permissions ---
  if (activeSchedule) {
    // 6a. Check schedule's allowedZoneIds
    if (activeSchedule.allowedZoneIds && activeSchedule.allowedZoneIds.length > 0) {
      if (!activeSchedule.allowedZoneIds.includes(containingZone.id)) {
        return {
          serviceable: false,
          reasonCode: "ZONE_INACTIVE_SCHEDULE",
          matchedZone: containingZone,
          activeSchedule,
          currentScheduleType,
          details: `Zone "${containingZone.name}" is not included in the "${activeSchedule.name}" window.`,
          timestamp,
        };
      }
    }

    // 6b. Check schedule's allowedTiers
    if (activeSchedule.allowedTiers && activeSchedule.allowedTiers.length > 0) {
      if (!activeSchedule.allowedTiers.includes(containingZone.tier)) {
        return {
          serviceable: false,
          reasonCode: "ZONE_INACTIVE_SCHEDULE",
          matchedZone: containingZone,
          activeSchedule,
          currentScheduleType,
          details: `Tier "${containingZone.tier}" for zone "${containingZone.name}" is inactive during "${activeSchedule.name}".`,
          timestamp,
        };
      }
    }

    // 6c. Check zone's allowedSchedules
    if (containingZone.allowedSchedules && containingZone.allowedSchedules.length > 0) {
      const scheduleMatches =
        containingZone.allowedSchedules.includes("24x7") ||
        containingZone.allowedSchedules.includes(activeSchedule.type) ||
        containingZone.allowedSchedules.includes(activeSchedule.id);

      if (!scheduleMatches) {
        return {
          serviceable: false,
          reasonCode: "ZONE_INACTIVE_SCHEDULE",
          matchedZone: containingZone,
          activeSchedule,
          currentScheduleType,
          details: `Zone "${containingZone.name}" does not operate during schedule type "${activeSchedule.type}".`,
          timestamp,
        };
      }
    }
  }

  // --- Success: Fully Serviceable ---
  return {
    serviceable: true,
    reasonCode: "SERVICEABLE",
    matchedZone: containingZone,
    activeSchedule,
    currentScheduleType,
    isOnBoundary: pointOnBoundary,
    details: `Deliveries active in "${containingZone.name}" (${containingZone.tier.toUpperCase()}) under ${activeSchedule ? activeSchedule.name : "standard protocol"}.`,
    timestamp,
  };
}
