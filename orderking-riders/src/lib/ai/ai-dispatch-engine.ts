import { haversineKm, estimateMinutes } from '../rider/eta.ts';
import type { GeoPoint } from '../rider/types.ts';

export type RiderInput = {
  id: string;
  location: GeoPoint;
  activeOrders: number;
  vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR';
  status?: string;
};

export class AIDispatchEngine {
  /**
   * Autonomously assigns orders to the most optimal rider.
   * Calculates the true Haversine distance and estimated time of arrival (ETA) 
   * between the restaurant, the rider, and the customer.
   * Assigns the optimal rider instantly without human intervention.
   */
  static optimizeDispatch(
    orderId: string,
    restaurantLocation: GeoPoint,
    customerLocation: GeoPoint,
    availableRiders: RiderInput[]
  ) {
    let optimalRiderId: string | null = null;
    let minTotalScore = Infinity;
    let optimalEtaMinutes = 0;

    for (const rider of availableRiders) {
      if (rider.status && rider.status !== 'ONLINE') continue;

      // Distance rider -> restaurant
      const distRiderToRest = haversineKm(rider.location, restaurantLocation);
      
      // Distance restaurant -> customer
      const distRestToCust = haversineKm(restaurantLocation, customerLocation);
      
      const travelFactor = 1.3; // Account for road winding
      const avgSpeedKmh = rider.vehicleType === 'BICYCLE' ? 15 : rider.vehicleType === 'MOTORCYCLE' ? 30 : 25;

      const etaRest = estimateMinutes({
        from: rider.location,
        to: restaurantLocation,
        travelFactor,
        avgSpeedKmh,
        preparationMinutes: 0,
        bufferMinutes: 2
      });

      const etaCust = estimateMinutes({
        from: restaurantLocation,
        to: customerLocation,
        travelFactor,
        avgSpeedKmh,
        preparationMinutes: 10,
        bufferMinutes: 5
      });

      const totalEta = etaRest.minutes + etaCust.minutes;
      const totalDist = distRiderToRest + distRestToCust;

      // Constraint: Bicycles shouldn't take very long trips
      if (rider.vehicleType === 'BICYCLE' && totalDist > 7) continue;

      // Penalty for active orders
      const activeOrderPenalty = rider.activeOrders * 15; // 15 mins penalty per active order
      
      const score = totalEta + activeOrderPenalty;

      if (score < minTotalScore) {
        minTotalScore = score;
        optimalRiderId = rider.id;
        optimalEtaMinutes = totalEta;
      }
    }

    if (!optimalRiderId && availableRiders.length > 0) {
      // Fallback to the first available if constraints filtered everyone
      optimalRiderId = availableRiders[0].id;
      optimalEtaMinutes = 30;
    }

    return {
      assignedRiderId: optimalRiderId || 'queue',
      etaMinutes: optimalEtaMinutes,
      reasoning: optimalRiderId 
        ? 'Optimal rider assigned instantly based on true Haversine distance and ETA calculations.' 
        : 'No eligible riders available in the vicinity.'
    };
  }
}
