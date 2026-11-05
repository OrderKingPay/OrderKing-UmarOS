/**
 * Quad-Party Order Lifecycle Synchronization Engine (quad-party-order-sync.ts)
 * Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 * Coordinates real-time state across Customer, Restaurant KDS, Rider Fleet, and UmarOS Command Center.
 */

export type OrderLifecycleStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DISPUTED';

export type PrepTimerMinutes = 10 | 15 | 25 | 35;

export interface MenuCustomizationGroup {
  groupId: string;
  groupName: 'Size' | 'Crust' | 'Spice Level' | string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  selectedOptions: Array<{
    optionId: string;
    label: string;
    priceDeltaPaise: number;
  }>;
}

export interface OrderLineItemSnapshot {
  itemId: string;
  name: string;
  quantity: number;
  baseUnitPricePaise: number; // Immutable historical price snapshot at order creation
  customizations: MenuCustomizationGroup[];
  lineTotalPaise: number;
}

export interface QuadPartyOrderRecord {
  orderId: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  merchantFssaiNumber: string;
  riderId: string | null;
  status: OrderLifecycleStatus;
  prepTimeMinutes: PrepTimerMinutes | null;
  rejectionReason: string | null;
  deliveryOtpPlain?: string; // Sent only to customer & verified by rider
  deliveryOtpHash: string;
  deliveryOtpVerified: boolean;
  itemsSnapshot: OrderLineItemSnapshot[];
  foodSubtotalPaise: number;
  packagingFeePaise: number;
  deliveryFeePaise: number;
  surgeFeePaise: number;
  riderBasePayoutPaise: number;
  riderSurgeIncentivePaise: number;
  customerTotalPaidPaise: number;
  deliveredLat: number | null;
  deliveredLng: number | null;
  updatedAtIso: string;
}

export interface ShiftGeofencePolicy {
  shiftName: 'DAY_SHIFT' | 'EVENING_SHIFT' | 'LATE_NIGHT_SHIFT';
  istHourStart: number;
  istHourEnd: number;
  maxRadiusKm: number;
}

export interface RiderCandidate {
  riderId: string;
  name: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  activeOrderCount: number;
  walletBalancePaise: number;
}

export interface BroadcastEventPayload {
  channel: string;
  event: string;
  orderId: string;
  status: OrderLifecycleStatus;
  timestampIso: string;
  metadata: Record<string, unknown>;
}

const VALID_STATE_TRANSITIONS: Record<OrderLifecycleStatus, OrderLifecycleStatus[]> = {
  PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'CANCELLED'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'OUT_FOR_DELIVERY'],
  RIDER_ASSIGNED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['DISPUTED'],
  REJECTED: [],
  CANCELLED: [],
  DISPUTED: [],
};

/**
 * Evaluates customizations & computes deterministic integer-paise line item price.
 */
export function validateAndComputeLineItemSnapshot(
  itemId: string,
  name: string,
  quantity: number,
  baseUnitPricePaise: number,
  customizations: MenuCustomizationGroup[]
): OrderLineItemSnapshot {
  if (!Number.isSafeInteger(baseUnitPricePaise) || baseUnitPricePaise < 0) {
    throw new Error('INVALID_BASE_PRICE_PAISE: Must be a non-negative integer in paise.');
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error('INVALID_QUANTITY: Must be a positive integer.');
  }

  let addonsUnitPaise = 0;

  for (const group of customizations) {
    const count = group.selectedOptions.length;
    if (group.required && count < Math.max(1, group.minSelect)) {
      throw new Error(`MANDATORY_ADDON_MISSING: Group "${group.groupName}" requires at least ${Math.max(1, group.minSelect)} selection(s).`);
    }
    if (count < group.minSelect) {
      throw new Error(`MIN_SELECTION_VIOLATION: Group "${group.groupName}" requires minimum ${group.minSelect} selection(s).`);
    }
    if (count > group.maxSelect) {
      throw new Error(`MAX_SELECTION_VIOLATION: Group "${group.groupName}" allows maximum ${group.maxSelect} selection(s).`);
    }

    for (const opt of group.selectedOptions) {
      if (!Number.isSafeInteger(opt.priceDeltaPaise) || opt.priceDeltaPaise < 0) {
        throw new Error(`INVALID_ADDON_PRICE_PAISE: Option "${opt.label}" must use non-negative integer paise.`);
      }
      addonsUnitPaise += opt.priceDeltaPaise;
    }
  }

  const lineTotalPaise = (baseUnitPricePaise + addonsUnitPaise) * quantity;

  return {
    itemId,
    name,
    quantity,
    baseUnitPricePaise,
    customizations: structuredClone(customizations),
    lineTotalPaise,
  };
}

/**
 * Returns the operational dispatch radius (km) based on IST hour (UTC+05:30):
 * - Day Shift (06:00 - 18:00 IST): 12.0 km
 * - Evening Shift (18:00 - 23:00 IST): 7.5 km
 * - Late-Night Shift (23:00 - 06:00 IST): 3.5 km
 */
export function getShiftGeofenceRadiusKm(dateUtc: Date = new Date()): {
  shiftName: 'DAY_SHIFT' | 'EVENING_SHIFT' | 'LATE_NIGHT_SHIFT';
  istHour: number;
  maxRadiusKm: number;
} {
  // Convert UTC timestamp to IST (UTC + 5 hours 30 minutes = +330 minutes)
  const istTimeMs = dateUtc.getTime() + 330 * 60 * 1000;
  const istDate = new Date(istTimeMs);
  const istHour = istDate.getUTCHours();

  if (istHour >= 6 && istHour < 18) {
    return { shiftName: 'DAY_SHIFT', istHour, maxRadiusKm: 12.0 };
  }
  if (istHour >= 18 && istHour < 23) {
    return { shiftName: 'EVENING_SHIFT', istHour, maxRadiusKm: 7.5 };
  }
  return { shiftName: 'LATE_NIGHT_SHIFT', istHour, maxRadiusKm: 3.5 };
}

/**
 * Great-circle Haversine distance in kilometers between two WGS84 coordinates.
 */
export function computeHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371.0088; // Mean Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}

export class QuadPartyOrderSyncEngine {
  private readonly orders = new Map<string, QuadPartyOrderRecord>();
  private readonly riderWallets = new Map<string, number>();
  private readonly broadcastLog: BroadcastEventPayload[] = [];
  private readonly hashFn: (plain: string) => string;

  constructor(hashFn: (plain: string) => string) {
    this.hashFn = hashFn;
  }

  public registerOrder(order: QuadPartyOrderRecord): void {
    this.orders.set(order.orderId, structuredClone(order));
    this.emitQuadBroadcast(order.orderId, order.status, {
      orderNumber: order.orderNumber,
      customerTotalPaidPaise: order.customerTotalPaidPaise,
    });
  }

  public getOrder(orderId: string): QuadPartyOrderRecord {
    const rec = this.orders.get(orderId);
    if (!rec) {
      throw new Error(`ORDER_NOT_FOUND: ${orderId}`);
    }
    return structuredClone(rec);
  }

  public getBroadcastLog(): BroadcastEventPayload[] {
    return [...this.broadcastLog];
  }

  public getRiderWalletBalancePaise(riderId: string): number {
    return this.riderWallets.get(riderId) || 0;
  }

  /**
   * 1-Tap Kitchen Accept on KDS with mandatory configurable prep timer (10m, 15m, 25m, 35m).
   */
  public kitchenAcceptOrder(orderId: string, prepTimeMinutes: PrepTimerMinutes): QuadPartyOrderRecord {
    if (![10, 15, 25, 35].includes(prepTimeMinutes)) {
      throw new Error(`INVALID_PREP_TIMER: ${prepTimeMinutes}m is not an allowed KDS prep timer (10, 15, 25, 35).`);
    }

    const order = this.getOrder(orderId);
    this.assertTransitionAllowed(order.status, 'ACCEPTED');

    order.status = 'ACCEPTED';
    order.prepTimeMinutes = prepTimeMinutes;
    order.updatedAtIso = new Date().toISOString();

    this.orders.set(orderId, order);
    this.emitQuadBroadcast(orderId, 'ACCEPTED', {
      prepTimeMinutes,
      audioAlertDisarmed: true,
    });

    return structuredClone(order);
  }

  /**
   * Kitchen Reject on KDS with mandatory reason logging.
   */
  public kitchenRejectOrder(orderId: string, rejectionReason: string): QuadPartyOrderRecord {
    const cleanReason = String(rejectionReason || '').trim();
    if (cleanReason.length < 5) {
      throw new Error('MANDATORY_REJECTION_REASON_MISSING: Restaurant must provide a specific rejection reason (min 5 chars).');
    }

    const order = this.getOrder(orderId);
    this.assertTransitionAllowed(order.status, 'REJECTED');

    order.status = 'REJECTED';
    order.rejectionReason = cleanReason;
    order.updatedAtIso = new Date().toISOString();

    this.orders.set(orderId, order);
    this.emitQuadBroadcast(orderId, 'REJECTED', { rejectionReason: cleanReason });

    return structuredClone(order);
  }

  /**
   * Kitchen marks food prepared & ready for pickup.
   */
  public markFoodReadyForPickup(orderId: string): QuadPartyOrderRecord {
    const order = this.getOrder(orderId);
    this.assertTransitionAllowed(order.status, 'READY_FOR_PICKUP');

    order.status = 'READY_FOR_PICKUP';
    order.updatedAtIso = new Date().toISOString();

    this.orders.set(orderId, order);
    this.emitQuadBroadcast(orderId, 'READY_FOR_PICKUP', {});

    return structuredClone(order);
  }

  /**
   * Shift-aware geofenced rider dispatch matching.
   */
  public matchAndAssignNearestRider(
    orderId: string,
    restaurantLat: number,
    restaurantLng: number,
    candidates: RiderCandidate[],
    nowUtc: Date = new Date()
  ): {
    order: QuadPartyOrderRecord;
    assignedRider: RiderCandidate;
    distanceKm: number;
    shiftPolicy: ReturnType<typeof getShiftGeofenceRadiusKm>;
    countdownWindowSeconds: number;
  } {
    const order = this.getOrder(orderId);
    this.assertTransitionAllowed(order.status, 'RIDER_ASSIGNED');

    const shiftPolicy = getShiftGeofenceRadiusKm(nowUtc);

    const eligible = candidates
      .filter((r) => r.isOnline && r.activeOrderCount === 0)
      .map((rider) => ({
        rider,
        distanceKm: computeHaversineDistanceKm(restaurantLat, restaurantLng, rider.lat, rider.lng),
      }))
      .filter((entry) => entry.distanceKm <= shiftPolicy.maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (eligible.length === 0) {
      throw new Error(
        `NO_RIDER_WITHIN_SHIFT_GEOFENCE: No active rider within ${shiftPolicy.maxRadiusKm} km for ${shiftPolicy.shiftName}.`
      );
    }

    const best = eligible[0];

    order.status = 'RIDER_ASSIGNED';
    order.riderId = best.rider.riderId;
    order.updatedAtIso = nowUtc.toISOString();

    this.orders.set(orderId, order);
    this.emitQuadBroadcast(orderId, 'RIDER_ASSIGNED', {
      riderId: best.rider.riderId,
      distanceKm: best.distanceKm,
      shiftName: shiftPolicy.shiftName,
      maxRadiusKm: shiftPolicy.maxRadiusKm,
      guaranteedBasePayoutPaise: order.riderBasePayoutPaise,
      surgeIncentivePaise: order.riderSurgeIncentivePaise,
      acceptPassCountdownSeconds: 30,
    });

    return {
      order: structuredClone(order),
      assignedRider: best.rider,
      distanceKm: best.distanceKm,
      shiftPolicy,
      countdownWindowSeconds: 30,
    };
  }

  public markOrderOutForDelivery(orderId: string): QuadPartyOrderRecord {
    const order = this.getOrder(orderId);
    if (!order.riderId) {
      throw new Error('RIDER_NOT_ASSIGNED: Cannot transition to OUT_FOR_DELIVERY without an assigned rider.');
    }
    this.assertTransitionAllowed(order.status, 'OUT_FOR_DELIVERY');

    order.status = 'OUT_FOR_DELIVERY';
    order.updatedAtIso = new Date().toISOString();

    this.orders.set(orderId, order);
    this.emitQuadBroadcast(orderId, 'OUT_FOR_DELIVERY', { riderId: order.riderId });

    return structuredClone(order);
  }

  /**
   * Mandatory 4-Digit Doorstep Delivery OTP Verification.
   * - Invalid OTP throws error & locks order in OUT_FOR_DELIVERY (ON_THE_WAY).
   * - Valid OTP transitions to DELIVERED, logs GPS coordinates, and credits rider earnings wallet.
   */
  public verifyDoorstepOtpAndCompleteDelivery(
    orderId: string,
    submittedOtp: string,
    gpsLat: number,
    gpsLng: number
  ): {
    order: QuadPartyOrderRecord;
    riderPayoutCreditedPaise: number;
    newRiderWalletBalancePaise: number;
  } {
    const order = this.getOrder(orderId);
    if (order.status !== 'OUT_FOR_DELIVERY') {
      throw new Error(`INVALID_DELIVERY_STATE: Order is in state ${order.status}, expected OUT_FOR_DELIVERY.`);
    }

    if (!/^\d{4}$/.test(String(submittedOtp || ''))) {
      throw new Error('DOORSTEP_OTP_FORMAT_INVALID: Doorstep OTP must be an exact 4-digit numeric pin. Order remains locked in OUT_FOR_DELIVERY.');
    }

    const candidateHash = this.hashFn(submittedOtp);
    if (candidateHash !== order.deliveryOtpHash) {
      throw new Error('DOORSTEP_OTP_MISMATCH: Submitted 4-digit OTP is invalid. Order remains locked in OUT_FOR_DELIVERY.');
    }

    order.deliveryOtpVerified = true;
    order.status = 'DELIVERED';
    order.deliveredLat = gpsLat;
    order.deliveredLng = gpsLng;
    order.updatedAtIso = new Date().toISOString();

    this.orders.set(orderId, order);

    const riderId = order.riderId!;
    const payoutPaise = order.riderBasePayoutPaise + order.riderSurgeIncentivePaise;
    const updatedBalance = (this.riderWallets.get(riderId) || 0) + payoutPaise;
    this.riderWallets.set(riderId, updatedBalance);

    this.emitQuadBroadcast(orderId, 'DELIVERED', {
      riderId,
      deliveredLat: gpsLat,
      deliveredLng: gpsLng,
      riderPayoutCreditedPaise: payoutPaise,
    });

    return {
      order: structuredClone(order),
      riderPayoutCreditedPaise: payoutPaise,
      newRiderWalletBalancePaise: updatedBalance,
    };
  }

  private assertTransitionAllowed(current: OrderLifecycleStatus, next: OrderLifecycleStatus): void {
    const allowed = VALID_STATE_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      throw new Error(`ILLEGAL_ORDER_STATE_TRANSITION: Cannot transition from ${current} to ${next}.`);
    }
  }

  private emitQuadBroadcast(
    orderId: string,
    status: OrderLifecycleStatus,
    metadata: Record<string, unknown>
  ): void {
    const channels = [
      `order:customer:${orderId}`,
      `order:partner_kds:${orderId}`,
      `order:rider_fleet:${orderId}`,
      `order:umaros_command:global`,
    ];
    const timestampIso = new Date().toISOString();
    for (const channel of channels) {
      this.broadcastLog.push({
        channel,
        event: 'ORDER_STATE_CHANGED',
        orderId,
        status,
        timestampIso,
        metadata,
      });
    }
  }
}
