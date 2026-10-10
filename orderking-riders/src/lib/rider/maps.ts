import type { GeoPoint } from "./types.ts";

export function mapsUrl(point: GeoPoint, label: string): string {
  const q = encodeURIComponent(`${point.lat},${point.lng} (${label})`);
  return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}&q=${q}`;
}

export function geoUrl(point: GeoPoint): string {
  return `geo:${point.lat},${point.lng}`;
}

/**
 * Direct Google Maps Turn-by-Turn navigation destination URL.
 */
export function googleNavigationUrl(point: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
}

/**
 * Direct Apple Maps Turn-by-Turn navigation URL.
 */
export function appleMapsUrl(point: GeoPoint, label = "Destination"): string {
  return `https://maps.apple.com/?daddr=${point.lat},${point.lng}&q=${encodeURIComponent(label)}&dirflg=d`;
}

/**
 * Verifies whether the delivery state is before restaurant pickup.
 */
export function isPrePickupState(state: string | null | undefined): boolean {
  if (!state) return false;
  return state === "OFFERED" ||
    state === "ACCEPTED" ||
    state === "ARRIVING_AT_RESTAURANT" ||
    state === "ARRIVED_AT_RESTAURANT";
}

/**
 * Resolves the active navigation target based on current delivery state lifecycle.
 */
export function getActiveNavigationTarget(
  pickup?: GeoPoint | null,
  drop?: GeoPoint | null,
  state?: string | null,
): { target: GeoPoint | null; isPickup: boolean; stageLabel: string } {
  const prePickup = isPrePickupState(state);
  if (prePickup && pickup) {
    return { target: pickup, isPickup: true, stageLabel: "Pickup at Restaurant" };
  }
  if (drop) {
    return { target: drop, isPickup: false, stageLabel: "Dropoff at Customer" };
  }
  return { target: pickup ?? null, isPickup: Boolean(pickup), stageLabel: "Pickup" };
}
