/**
 * UMAR OS - Supreme Autonomous Dispatch Engine
 * Domain: Logistics & Zero-Human Algorithmic Dispatch
 * 
 * Mandate:
 * 1. Algorithmic Order Flow:
 *    - Customer Places Order -> Merchant POS Auto-Accepts instantly.
 *    - Predictive Kitchen Prep Time (8–15 mins calculated from historical order item volume & kitchen rush mode).
 *    - Rider Assignment Window: Automatically assign nearest active rider at (Prep Time - 3 minutes)
 *      so the rider arrives exactly when the food is packed (zero rider dwell time).
 * 2. 1.5km Corridor Batching Logic:
 *    - Automatically combine 2 orders from the same restaurant or adjacent restaurants (< 300m apart)
 *      heading along the same 1.5km delivery corridor within a 7-minute placement window.
 * 3. Anti-Idle Re-Dispatch:
 *    - If an assigned rider does not accept or start moving within 90 seconds,
 *      automatically reassign the order to the next nearest rider with a ₹0 penalty waiver and polite reassignment log.
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export type KitchenRushMode = "NORMAL" | "RUSH" | "CRITICAL_PEAK";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  prepComplexity?: "LOW" | "MEDIUM" | "HIGH";
};

export type AutonomousOrderStatus =
  | "PLACED"
  | "AUTO_ACCEPTED"
  | "PREPARING"
  | "READY"
  | "RIDER_ASSIGNED"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface Rider {
  id: string;
  name: string;
  currentLocation: GeoLocation;
  isActive: boolean;
  isAvailable: boolean;
  assignedOrderId: string | null;
  speedMps?: number; // meters per second, defaults to 8.33 m/s (~30 km/h)
}

export interface ReassignmentRecord {
  previousRiderId: string;
  newRiderId: string;
  reassignedAt: number;
  idleDurationMs: number;
  penaltyWaived: boolean;
  penaltyPaise: number;
  logMessage: string;
}

export interface AutonomousOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
  items: OrderItem[];
  totalAmountPaise: number;
  rushMode: KitchenRushMode;
  status: AutonomousOrderStatus;
  placedAt: number;
  autoAcceptedAt: number;
  predictedPrepMinutes: number;
  expectedReadyAt: number;
  assignmentWindowAt: number; // Target timestamp = placedAt + (predictedPrepMinutes - 3) * 60000
  assignedRiderId: string | null;
  assignedAt: number | null;
  riderAcknowledged: boolean;
  riderMovingToPickup: boolean;
  estimatedRiderTransitMinutes: number;
  estimatedRiderDwellMinutes: number; // Zero dwell time when timed accurately
  batchId: string | null;
  reassignmentHistory: ReassignmentRecord[];
  auditLogs: Array<{ timestamp: number; event: string; detail: Record<string, unknown> }>;
}

export interface BatchedRouteStop {
  orderId: string;
  type: "PICKUP" | "DROPOFF";
  location: GeoLocation;
  addressLabel: string;
  estimatedArrivalMinutes: number;
}

export interface BatchedDispatchRoute {
  batchId: string;
  orderIds: [string, string];
  restaurantIds: string[];
  pickupDistanceMeters: number;
  corridorDistanceMeters: number;
  stops: BatchedRouteStop[];
  totalDistanceMeters: number;
  efficiencyGainPercent: number;
  createdAt: number;
}

export interface PlaceOrderInput {
  orderId?: string;
  orderNumber?: string;
  restaurantId: string;
  restaurantName: string;
  pickupLocation: GeoLocation;
  dropoffLocation: GeoLocation;
  items: OrderItem[];
  totalAmountPaise: number;
  rushMode?: KitchenRushMode;
  placedAt?: number | Date;
  historicalAvgPrepMinutes?: number;
}

export interface AssignmentResult {
  assigned: boolean;
  orderId: string;
  riderId: string | null;
  reason?: string;
  assignmentWindowReached: boolean;
  minutesUntilAssignmentWindow?: number;
  estimatedTransitMinutes?: number;
  estimatedDwellMinutes?: number;
}

export interface ReDispatchResult {
  reDispatched: boolean;
  orderId: string;
  previousRiderId: string;
  newRiderId: string;
  idleDurationSeconds: number;
  penaltyWaived: boolean;
  penaltyPaise: number;
  politeNotice: string;
  timestamp: number;
}

// ============================================================================
// GEOSPATIAL & HAVERSINE HELPERS
// ============================================================================

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(a: GeoLocation, b: GeoLocation): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);

  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculates bearing from origin to destination in degrees (0 - 360)
 */
export function calculateBearingDegrees(start: GeoLocation, end: GeoLocation): number {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const dLng = ((end.longitude - start.longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

// ============================================================================
// AUTONOMOUS DISPATCH ENGINE CLASS
// ============================================================================

export class AutonomousDispatchEngine {
  private orders: Map<string, AutonomousOrder> = new Map();
  private batchedRoutes: Map<string, BatchedDispatchRoute> = new Map();

  // Constants
  public readonly DEFAULT_RIDER_SPEED_MPS = 8.33; // ~30 km/h Indian urban courier average
  public readonly TARGET_TRANSIT_BUFFER_MINUTES = 3; // Rider arriving at Prep - 3 minutes
  public readonly MAX_BATCH_PICKUP_DISTANCE_METERS = 300; // < 300m adjacent restaurants
  public readonly MAX_BATCH_CORRIDOR_DISTANCE_METERS = 1500; // 1.5km delivery corridor
  public readonly MAX_BATCH_PLACEMENT_WINDOW_MS = 7 * 60 * 1000; // 7 minutes
  public readonly ANTI_IDLE_TIMEOUT_MS = 90 * 1000; // 90 seconds anti-idle threshold

  /**
   * 1. Predictive Kitchen Prep Time (8–15 mins calculated from historical order item volume & kitchen rush mode)
   */
  public predictKitchenPrepTime(params: {
    items: OrderItem[];
    rushMode?: KitchenRushMode;
    historicalAvgPrepMinutes?: number;
  }): {
    prepMinutes: number;
    baseMinutes: number;
    volumeAdditionMinutes: number;
    rushAdditionMinutes: number;
  } {
    const rush = params.rushMode || "NORMAL";
    const totalItemQuantity = params.items.reduce((sum, item) => sum + Math.max(1, item.quantity), 0);

    // Baseline prep time starts at 8 minutes for small volume (1-2 items)
    let baseMinutes = 8;
    if (params.historicalAvgPrepMinutes && params.historicalAvgPrepMinutes >= 8) {
      baseMinutes = Math.min(10, params.historicalAvgPrepMinutes);
    }

    // Volume addition: +1 minute for every 2 items beyond 2 items, up to +4 minutes
    const excessItems = Math.max(0, totalItemQuantity - 2);
    const volumeAdditionMinutes = Math.min(4, Math.floor(excessItems * 0.75));

    // Rush mode modifier:
    // NORMAL: +0 min
    // RUSH: +2 min
    // CRITICAL_PEAK: +3 min
    let rushAdditionMinutes = 0;
    if (rush === "RUSH") {
      rushAdditionMinutes = 2;
    } else if (rush === "CRITICAL_PEAK") {
      rushAdditionMinutes = 3;
    }

    // Calculate total and strictly clamp within canonical 8–15 minutes window
    let totalPrep = baseMinutes + volumeAdditionMinutes + rushAdditionMinutes;
    totalPrep = Math.max(8, Math.min(15, totalPrep));

    return {
      prepMinutes: totalPrep,
      baseMinutes,
      volumeAdditionMinutes,
      rushAdditionMinutes,
    };
  }

  /**
   * 2. Algorithmic Order Flow:
   * Customer Places Order -> Merchant POS Auto-Accepts instantly with zero human delay.
   */
  public placeOrder(input: PlaceOrderInput): AutonomousOrder {
    const placedTime = input.placedAt
      ? typeof input.placedAt === "number"
        ? input.placedAt
        : input.placedAt.getTime()
      : Date.now();

    const orderId = input.orderId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = input.orderNumber || `OK-${Math.floor(1000 + Math.random() * 9000)}`;
    const rushMode = input.rushMode || "NORMAL";

    // Calculate predictive kitchen prep time (8-15 mins)
    const prepPrediction = this.predictKitchenPrepTime({
      items: input.items,
      rushMode,
      historicalAvgPrepMinutes: input.historicalAvgPrepMinutes,
    });

    const prepMinutes = prepPrediction.prepMinutes;
    const autoAcceptedAt = placedTime; // Instant POS auto-accept
    const expectedReadyAt = autoAcceptedAt + prepMinutes * 60 * 1000;

    // Rider assignment window: (Prep Time - 3 minutes)
    // If prep time is 10 mins, rider is assigned at 7 mins after placement.
    const assignmentWindowMs = Math.max(0, (prepMinutes - this.TARGET_TRANSIT_BUFFER_MINUTES) * 60 * 1000);
    const assignmentWindowAt = autoAcceptedAt + assignmentWindowMs;

    const autonomousOrder: AutonomousOrder = {
      id: orderId,
      orderNumber,
      restaurantId: input.restaurantId,
      restaurantName: input.restaurantName,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation,
      items: input.items,
      totalAmountPaise: input.totalAmountPaise,
      rushMode,
      status: "AUTO_ACCEPTED",
      placedAt: placedTime,
      autoAcceptedAt,
      predictedPrepMinutes: prepMinutes,
      expectedReadyAt,
      assignmentWindowAt,
      assignedRiderId: null,
      assignedAt: null,
      riderAcknowledged: false,
      riderMovingToPickup: false,
      estimatedRiderTransitMinutes: this.TARGET_TRANSIT_BUFFER_MINUTES,
      estimatedRiderDwellMinutes: 0,
      batchId: null,
      reassignmentHistory: [],
      auditLogs: [
        {
          timestamp: placedTime,
          event: "ORDER_PLACED_AND_AUTO_ACCEPTED",
          detail: {
            orderNumber,
            predictedPrepMinutes: prepMinutes,
            autoAcceptedAt,
            expectedReadyAt,
            assignmentWindowAt,
            prepBreakdown: prepPrediction,
          },
        },
      ],
    };

    this.orders.set(orderId, autonomousOrder);
    return autonomousOrder;
  }

  /**
   * 3. Rider Assignment Window:
   * Automatically assign nearest active rider at (Prep Time - 3 minutes)
   * so the rider arrives exactly when the food is packed (zero rider dwell time).
   */
  public evaluateRiderAssignment(
    orderId: string,
    currentTimeInput: number | Date,
    availableRiders: Rider[]
  ): AssignmentResult {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found in autonomous dispatch engine`);
    }

    if (order.assignedRiderId) {
      return {
        assigned: true,
        orderId,
        riderId: order.assignedRiderId,
        assignmentWindowReached: true,
        reason: "Rider already assigned",
        estimatedTransitMinutes: order.estimatedRiderTransitMinutes,
        estimatedDwellMinutes: order.estimatedRiderDwellMinutes,
      };
    }

    const currentTime = typeof currentTimeInput === "number" ? currentTimeInput : currentTimeInput.getTime();

    // Check if the current time has reached the assignment window: (Prep Time - 3 mins)
    if (currentTime < order.assignmentWindowAt) {
      const remainingMs = order.assignmentWindowAt - currentTime;
      const minutesUntilWindow = Number((remainingMs / 60000).toFixed(2));
      return {
        assigned: false,
        orderId,
        riderId: null,
        assignmentWindowReached: false,
        minutesUntilAssignmentWindow: minutesUntilWindow,
        reason: `Holding assignment until optimal dispatch window (${minutesUntilWindow} mins remaining to avoid rider dwell)`,
      };
    }

    // Filter eligible active riders
    const eligibleRiders = availableRiders.filter(
      (r) => r.isActive && r.isAvailable && (!r.assignedOrderId || r.assignedOrderId === orderId)
    );

    if (eligibleRiders.length === 0) {
      return {
        assigned: false,
        orderId,
        riderId: null,
        assignmentWindowReached: true,
        reason: "No active riders available in zone for dispatch",
      };
    }

    // Sort riders by proximity to the restaurant pickup location
    const sortedRiders = [...eligibleRiders].sort((a, b) => {
      const distA = haversineDistanceMeters(a.currentLocation, order.pickupLocation);
      const distB = haversineDistanceMeters(b.currentLocation, order.pickupLocation);
      return distA - distB;
    });

    const chosenRider = sortedRiders[0];
    const distanceToPickupMeters = haversineDistanceMeters(chosenRider.currentLocation, order.pickupLocation);
    const speedMps = chosenRider.speedMps || this.DEFAULT_RIDER_SPEED_MPS;
    const transitSeconds = distanceToPickupMeters / speedMps;
    const transitMinutes = Math.max(1, Math.round(transitSeconds / 60));

    // Calculate arrival time vs ready time:
    // Synchronized with (Prep Time - 3 minutes) assignment window so rider arrives exactly when food is packed
    const expectedRiderArrivalAt = currentTime + this.TARGET_TRANSIT_BUFFER_MINUTES * 60 * 1000;
    const dwellMs = Math.max(0, order.expectedReadyAt - expectedRiderArrivalAt);
    const estimatedDwellMinutes = Math.round(dwellMs / 60000);

    // Update order
    order.assignedRiderId = chosenRider.id;
    order.assignedAt = currentTime;
    order.status = "RIDER_ASSIGNED";
    order.estimatedRiderTransitMinutes = transitMinutes;
    order.estimatedRiderDwellMinutes = estimatedDwellMinutes;
    order.auditLogs.push({
      timestamp: currentTime,
      event: "RIDER_ASSIGNED_AT_WINDOW",
      detail: {
        riderId: chosenRider.id,
        distanceToPickupMeters,
        transitMinutes,
        estimatedDwellMinutes,
        zeroDwellAchieved: estimatedDwellMinutes === 0,
      },
    });

    // Mark rider busy
    chosenRider.isAvailable = false;
    chosenRider.assignedOrderId = order.id;

    return {
      assigned: true,
      orderId,
      riderId: chosenRider.id,
      assignmentWindowReached: true,
      estimatedTransitMinutes: transitMinutes,
      estimatedDwellMinutes,
    };
  }

  /**
   * 4. 1.5km Corridor Batching Logic:
   * Automatically combine 2 orders from the same restaurant or adjacent restaurants (< 300m apart)
   * heading along the same 1.5km delivery corridor within a 7-minute placement window.
   */
  public evaluateBatchEligibility(
    orderA: AutonomousOrder,
    orderB: AutonomousOrder
  ): {
    eligible: boolean;
    pickupDistanceMeters: number;
    corridorDistanceMeters: number;
    placementDeltaMinutes: number;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // 1. Placement window check (<= 7 minutes)
    const placementDeltaMs = Math.abs(orderA.placedAt - orderB.placedAt);
    const placementDeltaMinutes = Number((placementDeltaMs / 60000).toFixed(2));
    if (placementDeltaMs > this.MAX_BATCH_PLACEMENT_WINDOW_MS) {
      reasons.push(
        `Placement delta ${placementDeltaMinutes} mins exceeds 7-minute window limit`
      );
    }

    // 2. Pickup location proximity: same restaurant OR adjacent (< 300m)
    const isSameRestaurant = orderA.restaurantId === orderB.restaurantId;
    const pickupDistanceMeters = isSameRestaurant
      ? 0
      : haversineDistanceMeters(orderA.pickupLocation, orderB.pickupLocation);

    if (!isSameRestaurant && pickupDistanceMeters > this.MAX_BATCH_PICKUP_DISTANCE_METERS) {
      reasons.push(
        `Pickup distance ${pickupDistanceMeters}m exceeds 300m adjacent restaurant threshold`
      );
    }

    // 3. Dropoff 1.5km Corridor check:
    // Distance between dropoffs <= 1.5km (1500 meters)
    const dropoffDistanceMeters = haversineDistanceMeters(orderA.dropoffLocation, orderB.dropoffLocation);
    const corridorDistanceMeters = dropoffDistanceMeters;

    if (dropoffDistanceMeters > this.MAX_BATCH_CORRIDOR_DISTANCE_METERS) {
      reasons.push(
        `Corridor dropoff distance ${dropoffDistanceMeters}m exceeds 1.5km corridor threshold`
      );
    }

    // 4. Status eligibility check: both should not yet be picked up
    const inActivePickupState = (s: AutonomousOrderStatus) =>
      s === "AUTO_ACCEPTED" || s === "PREPARING" || s === "READY" || s === "RIDER_ASSIGNED";

    if (!inActivePickupState(orderA.status) || !inActivePickupState(orderB.status)) {
      reasons.push("Orders must be in pre-pickup active state for batching");
    }

    return {
      eligible: reasons.length === 0,
      pickupDistanceMeters,
      corridorDistanceMeters,
      placementDeltaMinutes,
      reasons,
    };
  }

  /**
   * Combines 2 eligible orders into an optimized 1.5km corridor batch route.
   */
  public batchOrders(orderAId: string, orderBId: string): BatchedDispatchRoute | null {
    const orderA = this.orders.get(orderAId);
    const orderB = this.orders.get(orderBId);

    if (!orderA || !orderB) {
      return null;
    }

    const evaluation = this.evaluateBatchEligibility(orderA, orderB);
    if (!evaluation.eligible) {
      return null;
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build stops sequence:
    // Pickup A -> Pickup B (if different) -> Dropoff closest -> Dropoff farthest
    const distDropA = haversineDistanceMeters(orderA.pickupLocation, orderA.dropoffLocation);
    const distDropB = haversineDistanceMeters(orderA.pickupLocation, orderB.dropoffLocation);

    const firstDropOrder = distDropA <= distDropB ? orderA : orderB;
    const secondDropOrder = firstDropOrder.id === orderA.id ? orderB : orderA;

    const stops: BatchedRouteStop[] = [
      {
        orderId: orderA.id,
        type: "PICKUP",
        location: orderA.pickupLocation,
        addressLabel: orderA.restaurantName,
        estimatedArrivalMinutes: 3,
      },
    ];

    if (orderA.restaurantId !== orderB.restaurantId) {
      stops.push({
        orderId: orderB.id,
        type: "PICKUP",
        location: orderB.pickupLocation,
        addressLabel: orderB.restaurantName,
        estimatedArrivalMinutes: 5,
      });
    }

    stops.push(
      {
        orderId: firstDropOrder.id,
        type: "DROPOFF",
        location: firstDropOrder.dropoffLocation,
        addressLabel: `Customer Dropoff (${firstDropOrder.orderNumber})`,
        estimatedArrivalMinutes: 12,
      },
      {
        orderId: secondDropOrder.id,
        type: "DROPOFF",
        location: secondDropOrder.dropoffLocation,
        addressLabel: `Customer Dropoff (${secondDropOrder.orderNumber})`,
        estimatedArrivalMinutes: 16,
      }
    );

    const totalDistanceMeters =
      evaluation.pickupDistanceMeters +
      haversineDistanceMeters(orderB.pickupLocation, firstDropOrder.dropoffLocation) +
      evaluation.corridorDistanceMeters;

    // Efficiency gain: single rider delivering 2 orders along corridor saves ~35-40% travel distance
    const soloDistanceTotal =
      haversineDistanceMeters(orderA.pickupLocation, orderA.dropoffLocation) +
      haversineDistanceMeters(orderB.pickupLocation, orderB.dropoffLocation);

    const distanceSaved = Math.max(0, soloDistanceTotal - totalDistanceMeters);
    const efficiencyGainPercent = soloDistanceTotal > 0
      ? Number(((distanceSaved / soloDistanceTotal) * 100).toFixed(1))
      : 30;

    const batchedRoute: BatchedDispatchRoute = {
      batchId,
      orderIds: [orderA.id, orderB.id],
      restaurantIds: Array.from(new Set([orderA.restaurantId, orderB.restaurantId])),
      pickupDistanceMeters: evaluation.pickupDistanceMeters,
      corridorDistanceMeters: evaluation.corridorDistanceMeters,
      stops,
      totalDistanceMeters,
      efficiencyGainPercent,
      createdAt: Date.now(),
    };

    orderA.batchId = batchId;
    orderB.batchId = batchId;

    orderA.auditLogs.push({
      timestamp: Date.now(),
      event: "CORRIDOR_BATCHED",
      detail: { batchId, partnerOrderId: orderB.id, efficiencyGainPercent },
    });
    orderB.auditLogs.push({
      timestamp: Date.now(),
      event: "CORRIDOR_BATCHED",
      detail: { batchId, partnerOrderId: orderA.id, efficiencyGainPercent },
    });

    this.batchedRoutes.set(batchId, batchedRoute);
    return batchedRoute;
  }

  /**
   * 5. Anti-Idle Re-Dispatch:
   * If an assigned rider does not accept or start moving within 90 seconds,
   * automatically reassign the order to the next nearest rider with a ₹0 penalty waiver
   * and polite reassignment log.
   */
  public checkAntiIdleAndReDispatch(
    orderId: string,
    currentTimeInput: number | Date,
    availableRiders: Rider[]
  ): ReDispatchResult | null {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.assignedRiderId || !order.assignedAt) {
      return null;
    }

    // If the rider already started moving or acknowledged, no idle re-dispatch needed
    if (order.riderMovingToPickup) {
      return null;
    }

    const currentTime = typeof currentTimeInput === "number" ? currentTimeInput : currentTimeInput.getTime();
    const idleDurationMs = currentTime - order.assignedAt;

    if (idleDurationMs < this.ANTI_IDLE_TIMEOUT_MS) {
      return null; // Has not exceeded 90 seconds
    }

    const previousRiderId = order.assignedRiderId;
    const idleSeconds = Math.round(idleDurationMs / 1000);

    // Polite reassignment log with zero penalty waiver
    const politeNotice = `Polite notice: Delivery partner ${previousRiderId} remained stationary for ${idleSeconds}s (>90s SLA). Reassigning order #${order.orderNumber} to next nearest active partner. ₹0 penalty applied under autonomous flow.`;

    // Release previous rider without monetary penalty
    const prevRider = availableRiders.find((r) => r.id === previousRiderId);
    if (prevRider) {
      prevRider.isAvailable = true;
      prevRider.assignedOrderId = null;
    }

    // Find next nearest active and available rider (excluding previous rider)
    const alternativeRiders = availableRiders
      .filter((r) => r.id !== previousRiderId && r.isActive && r.isAvailable)
      .sort((a, b) => {
        const distA = haversineDistanceMeters(a.currentLocation, order.pickupLocation);
        const distB = haversineDistanceMeters(b.currentLocation, order.pickupLocation);
        return distA - distB;
      });

    if (alternativeRiders.length === 0) {
      // Record idle warning if no other rider currently in range
      order.auditLogs.push({
        timestamp: currentTime,
        event: "RIDER_IDLE_TIMEOUT_STANDBY",
        detail: { previousRiderId, idleSeconds, notice: politeNotice },
      });
      return null;
    }

    const nextRider = alternativeRiders[0];

    // Record reassignment
    const reassignmentRecord: ReassignmentRecord = {
      previousRiderId,
      newRiderId: nextRider.id,
      reassignedAt: currentTime,
      idleDurationMs,
      penaltyWaived: true,
      penaltyPaise: 0,
      logMessage: politeNotice,
    };

    order.reassignmentHistory.push(reassignmentRecord);
    order.assignedRiderId = nextRider.id;
    order.assignedAt = currentTime;
    order.riderAcknowledged = false;
    order.riderMovingToPickup = false;

    // Update new rider status
    nextRider.isAvailable = false;
    nextRider.assignedOrderId = order.id;

    order.auditLogs.push({
      timestamp: currentTime,
      event: "ANTI_IDLE_RE_DISPATCHED",
      detail: {
        previousRiderId,
        newRiderId: nextRider.id,
        idleDurationMs,
        penaltyPaise: 0,
        penaltyWaived: true,
        politeNotice,
      },
    });

    return {
      reDispatched: true,
      orderId: order.id,
      previousRiderId,
      newRiderId: nextRider.id,
      idleDurationSeconds: idleSeconds,
      penaltyWaived: true,
      penaltyPaise: 0,
      politeNotice,
      timestamp: currentTime,
    };
  }

  /**
   * Helper to mark rider moving/acknowledged
   */
  public notifyRiderMovement(orderId: string, riderId: string): void {
    const order = this.orders.get(orderId);
    if (order && order.assignedRiderId === riderId) {
      order.riderMovingToPickup = true;
      order.riderAcknowledged = true;
      order.auditLogs.push({
        timestamp: Date.now(),
        event: "RIDER_STARTED_TRANSIT",
        detail: { riderId },
      });
    }
  }

  /**
   * 6. Zero-Human Autonomous Order Transition Engine:
   * Executes algorithmic state transitions with zero human intervention:
   * AUTO_ACCEPTED -> PREPARING -> READY -> RIDER_ASSIGNED -> ON_THE_WAY -> DELIVERED
   */
  public transitionAutonomousStatus(
    orderId: string,
    targetStatus: AutonomousOrderStatus,
    detail: Record<string, unknown> = {}
  ): AutonomousOrder {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found in autonomous dispatch engine`);
    }

    const currentStatus = order.status;

    // Validate autonomous zero-human legal transitions
    const validNextStatuses: Record<AutonomousOrderStatus, AutonomousOrderStatus[]> = {
      PLACED: ["AUTO_ACCEPTED", "CANCELLED"],
      AUTO_ACCEPTED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["RIDER_ASSIGNED", "CANCELLED"],
      RIDER_ASSIGNED: ["PICKED_UP", "ON_THE_WAY", "CANCELLED"],
      PICKED_UP: ["ON_THE_WAY", "OUT_FOR_DELIVERY"],
      ON_THE_WAY: ["DELIVERED"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    const allowed = validNextStatuses[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(
        `Invalid zero-human transition from ${currentStatus} to ${targetStatus}`
      );
    }

    const now = typeof detail.timestamp === "number" ? detail.timestamp : Date.now();
    order.status = targetStatus;
    order.auditLogs.push({
      timestamp: now,
      event: `AUTONOMOUS_TRANSITION_${targetStatus}`,
      detail: {
        from: currentStatus,
        to: targetStatus,
        actor: "system",
        zeroHumanIntervention: true,
        ...detail,
      },
    });

    return order;
  }

  public transitionToPreparing(orderId: string, timestamp?: number): AutonomousOrder {
    return this.transitionAutonomousStatus(orderId, "PREPARING", { timestamp });
  }

  public transitionToReady(orderId: string, timestamp?: number): AutonomousOrder {
    return this.transitionAutonomousStatus(orderId, "READY", { timestamp });
  }

  public transitionToOnTheWay(orderId: string, timestamp?: number): AutonomousOrder {
    return this.transitionAutonomousStatus(orderId, "ON_THE_WAY", { timestamp });
  }

  public transitionToDelivered(
    orderId: string,
    timestamp?: number,
    handoverOtp?: string
  ): AutonomousOrder {
    return this.transitionAutonomousStatus(orderId, "DELIVERED", {
      timestamp,
      handoverOtpVerified: Boolean(handoverOtp),
    });
  }

  public getOrder(orderId: string): AutonomousOrder | undefined {
    return this.orders.get(orderId);
  }

  public getBatch(batchId: string): BatchedDispatchRoute | undefined {
    return this.batchedRoutes.get(batchId);
  }

  public getAllOrders(): AutonomousOrder[] {
    return Array.from(this.orders.values());
  }
}
