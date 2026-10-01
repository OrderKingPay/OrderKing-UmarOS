/**
 * HYPER-FLEET GEOSPATIAL ENGINE
 * 
 * Banking-grade spatial order-batching algorithm.
 * Uses advanced GeoJSON proximity clusters and time-window overlaps to maximize 
 * founder margin by mapping multi-pickup/multi-dropoff routes to single riders.
 */

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ActiveOrder {
  orderId: string;
  restaurantLocation: GeoCoordinate;
  customerLocation: GeoCoordinate;
  readyByTime: number; // Unix timestamp milliseconds
  maxDeliveryTime: number; // Unix timestamp milliseconds
}

export interface AvailableRider {
  riderId: string;
  currentLocation: GeoCoordinate;
}

export interface BatchedRoute {
  riderId: string;
  assignedOrderIds: string[];
  totalEstimatedDistanceKm: number;
  expectedMarginIncreasePercent: number;
}

export class HyperFleetEngine {
  private static readonly EARTH_RADIUS_KM = 6371;
  private static readonly MAX_PICKUP_CLUSTER_RADIUS_KM = 1.5;
  private static readonly MAX_DROPOFF_CLUSTER_RADIUS_KM = 2.0;
  private static readonly MAX_TIME_WINDOW_DELTA_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * The genuine Haversine Formula for mathematically precise Earth-surface distance.
   * Eliminates the need for expensive Google Maps API calls during early spatial clustering.
   */
  public static calculateHaversineDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const dLat = toRadians(coord2.latitude - coord1.latitude);
    const dLon = toRadians(coord2.longitude - coord1.longitude);
    
    const lat1 = toRadians(coord1.latitude);
    const lat2 = toRadians(coord2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Converts our standard GeoCoordinate to strict GeoJSON for database spatial queries.
   */
  public static toGeoJSON(coord: GeoCoordinate): GeoJSONPoint {
    return {
      type: 'Point',
      coordinates: [coord.longitude, coord.latitude]
    };
  }

  /**
   * The Omnipotent Batching Algorithm.
   * Scans all active unassigned orders, identifies synergistic routes mathematically, 
   * and pairs them to a single rider to extract double/triple delivery fees while paying a single base fare.
   */
  public static calculateOptimalBatches(
    unassignedOrders: ActiveOrder[], 
    availableRiders: AvailableRider[]
  ): BatchedRoute[] {
    const batches: BatchedRoute[] = [];
    const processedOrderIds = new Set<string>();

    for (let i = 0; i < unassignedOrders.length; i++) {
      const anchorOrder = unassignedOrders[i];
      if (processedOrderIds.has(anchorOrder.orderId)) continue;

      const currentBatch = [anchorOrder];
      processedOrderIds.add(anchorOrder.orderId);

      // Look for synergistic orders to bundle with the anchor
      for (let j = i + 1; j < unassignedOrders.length; j++) {
        const candidateOrder = unassignedOrders[j];
        if (processedOrderIds.has(candidateOrder.orderId)) continue;

        const pickupDist = this.calculateHaversineDistance(anchorOrder.restaurantLocation, candidateOrder.restaurantLocation);
        const dropoffDist = this.calculateHaversineDistance(anchorOrder.customerLocation, candidateOrder.customerLocation);
        const timeDelta = Math.abs(anchorOrder.readyByTime - candidateOrder.readyByTime);

        if (
          pickupDist <= this.MAX_PICKUP_CLUSTER_RADIUS_KM && 
          dropoffDist <= this.MAX_DROPOFF_CLUSTER_RADIUS_KM && 
          timeDelta <= this.MAX_TIME_WINDOW_DELTA_MS
        ) {
          currentBatch.push(candidateOrder);
          processedOrderIds.add(candidateOrder.orderId);
        }
      }

      // If we formed a batch or have a single order, find the closest optimal rider
      if (availableRiders.length > 0) {
        // Calculate the geographic centroid of the pickups
        const centroidLat = currentBatch.reduce((sum, o) => sum + o.restaurantLocation.latitude, 0) / currentBatch.length;
        const centroidLon = currentBatch.reduce((sum, o) => sum + o.restaurantLocation.longitude, 0) / currentBatch.length;
        const pickupCentroid: GeoCoordinate = { latitude: centroidLat, longitude: centroidLon };

        let bestRider = availableRiders[0];
        let shortestDist = this.calculateHaversineDistance(bestRider.currentLocation, pickupCentroid);

        for (let k = 1; k < availableRiders.length; k++) {
          const riderDist = this.calculateHaversineDistance(availableRiders[k].currentLocation, pickupCentroid);
          if (riderDist < shortestDist) {
            shortestDist = riderDist;
            bestRider = availableRiders[k];
          }
        }

        // Calculate Founder Margin Increase:
        // Batching N orders to 1 rider saves (N-1) base fares. 
        // We mathematically represent this as a margin increase percentage.
        const expectedMarginIncreasePercent = (currentBatch.length - 1) * 100;

        batches.push({
          riderId: bestRider.riderId,
          assignedOrderIds: currentBatch.map(o => o.orderId),
          totalEstimatedDistanceKm: shortestDist + 
            this.calculateHaversineDistance(pickupCentroid, anchorOrder.customerLocation), // simplified final route dist
          expectedMarginIncreasePercent
        });

        // Remove the assigned rider from pool
        availableRiders = availableRiders.filter(r => r.riderId !== bestRider.riderId);
      }
    }

    return batches;
  }
}
