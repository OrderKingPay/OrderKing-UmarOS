// In a real project, getSql would be imported from your database module.
declare function getSql(query: string, params?: any[]): Promise<any>;

/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @returns Distance in meters
 */
export function getHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TelemetryEvent {
  orderId: string;
  riderId: string;
  riderLocation: Coordinates;
  restaurantLocation: Coordinates;
  customerLocation: Coordinates;
  currentOrderStatus: string;
}

/**
 * Evaluates a telemetry event from a Rider and performs geofencing math.
 * If a 500-meter geofence is breached, it executes an SQL update via getSql().
 */
export async function evaluateRiderGeofence(event: TelemetryEvent): Promise<void> {
  const GEOFENCE_RADIUS_METERS = 500;

  // 1. Geofence around Restaurant
  if (event.currentOrderStatus === 'HEADING_TO_RESTAURANT') {
    const distToRestaurant = getHaversineDistanceMeters(
      event.riderLocation.lat,
      event.riderLocation.lng,
      event.restaurantLocation.lat,
      event.restaurantLocation.lng
    );

    if (distToRestaurant <= GEOFENCE_RADIUS_METERS) {
      await getSql(`UPDATE orders SET status = 'ARRIVED_AT_RESTAURANT', updated_at = NOW() WHERE id = $1`, [event.orderId]);
      console.log(`[Telemetry] Rider ${event.riderId} breached Restaurant geofence for order ${event.orderId}. Status updated.`);
      return;
    }
  }

  // 2. Geofence around Customer
  if (event.currentOrderStatus === 'OUT_FOR_DELIVERY') {
    const distToCustomer = getHaversineDistanceMeters(
      event.riderLocation.lat,
      event.riderLocation.lng,
      event.customerLocation.lat,
      event.customerLocation.lng
    );

    if (distToCustomer <= GEOFENCE_RADIUS_METERS) {
      await getSql(`UPDATE orders SET status = 'ARRIVED_AT_CUSTOMER', updated_at = NOW() WHERE id = $1`, [event.orderId]);
      console.log(`[Telemetry] Rider ${event.riderId} breached Customer geofence for order ${event.orderId}. Status updated.`);
      return;
    }
  }
}
