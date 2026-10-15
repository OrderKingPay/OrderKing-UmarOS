import { haversineKm } from "./eta.ts";
import { RiderError, type GeoPoint, type LocationPing, type VehicleType } from "./types.ts";

/** Vehicle-specific velocity caps (km/h) */
export const VEHICLE_SPEED_LIMITS_KMH: Record<VehicleType, number> = {
  MOTORCYCLE: 80,
  SCOOTER: 80,
  BICYCLE: 30,
  WALKING: 15,
};

/** Motorcycle-class hard cap. Instant teleports are treated as spoofed. */
export const MAX_PLAUSIBLE_KMH = 80;
export const MIN_TELEPORT_KM = 0.05;

export function assertValidCoordinates(point: GeoPoint): void {
  if (
    !Number.isFinite(point.lat) ||
    !Number.isFinite(point.lng) ||
    point.lat < -90 ||
    point.lat > 90 ||
    point.lng < -180 ||
    point.lng > 180
  ) {
    throw new RiderError("FAKE_GPS", "Location is not a valid coordinate", 400);
  }
}

/**
 * Rejects physically impossible jumps. This is not live GPS verification —
 * Window 5 may add device attestation. Window 3 never trusts the client clock
 * or a self-declared "I'm here" without a plausible delta.
 *
 * Enforces vehicle-specific velocity caps:
 * - MOTORCYCLE / SCOOTER: 80 km/h
 * - BICYCLE: 30 km/h
 * - WALKING: 15 km/h
 */
export function assertPlausiblePing(
  previous: LocationPing | null,
  next: GeoPoint,
  atIso: string,
  vehicleType?: VehicleType,
): void {
  assertValidCoordinates(next);
  if (!previous) return;
  const km = haversineKm(previous.point, next);
  const elapsedMs = new Date(atIso).getTime() - new Date(previous.at).getTime();
  if (!Number.isFinite(elapsedMs)) {
    throw new RiderError("FAKE_GPS", "Location timestamp is invalid", 400);
  }
  if (elapsedMs <= 0) {
    if (km > MIN_TELEPORT_KM) {
      throw new RiderError("FAKE_GPS", "Location jump is not physically possible", 400);
    }
    return;
  }
  const hours = Math.max(elapsedMs / 3_600_000, 1 / 3_600_000);
  const kmh = km / hours;
  const maxKmh = vehicleType && VEHICLE_SPEED_LIMITS_KMH[vehicleType] != null
    ? VEHICLE_SPEED_LIMITS_KMH[vehicleType]
    : MAX_PLAUSIBLE_KMH;
  if (kmh > maxKmh) {
    throw new RiderError(
      "FAKE_GPS",
      `Location jump exceeds plausible speed limit for ${vehicleType ?? "vehicle"} (${Math.round(kmh)} km/h > ${maxKmh} km/h)`,
      400,
    );
  }
}
