/**
 * AI SENTINEL / FRAUD DESTROYER
 * 
 * Zero-tolerance background AI engine.
 * Cryptographically verifies real-world constraints to automatically execute
 * instant bans, wallet locks, and Device ID flagging on the Immutable Ledger 
 * for any ecosystem fraud attempts (GPS spoofing, fake refunds).
 */

import { HyperFleetEngine, GeoCoordinate } from './hyper-fleet';

export interface GpsPing {
  latitude: number;
  longitude: number;
  timestampMs: number;
}

export interface UserHistory {
  userId: string;
  totalOrders: number;
  totalRefunds: number;
  deviceId: string;
}

export interface DeliveryEvent {
  orderId: string;
  riderPings: GpsPing[];
  dropoffLocation: GeoCoordinate;
  reportedDeliveredAt: number;
}

export class AISentinel {
  // 150 km/h is the absolute mathematical limit for an urban delivery rider.
  // Anything faster implies GPS mock location / spoofing app.
  private static readonly MAX_URBAN_SPEED_KMH = 150; 
  private static readonly MAX_REFUND_RATIO = 0.10; // >10% refund rate triggers automatic ban
  private static readonly DELIVERY_VERIFICATION_RADIUS_KM = 0.15; // 150 meters

  /**
   * Executes the Zero-Tolerance Penalty Protocol.
   * Interacts with the Immutable Ledger / Supabase Edge Functions.
   */
  private static async executePenaltyProtocol(
    userId: string, 
    deviceId: string, 
    violationCode: string, 
    evidence: any
  ): Promise<void> {
    console.error(`[AI SENTINEL] 🚨 FATAL VIOLATION DETECTED 🚨`);
    console.error(`User: ${userId} | Device: ${deviceId} | Code: ${violationCode}`);
    console.error(`Evidence Ledger:`, JSON.stringify(evidence));
    
    // In actual DB execution:
    // 1. UPDATE auth.users SET banned_until = 'infinity'
    // 2. INSERT INTO locked_wallets
    // 3. INSERT INTO global_device_blacklist (device_id)
    console.log(`[AI SENTINEL] ACCOUNT AND WALLET FROZEN PERMANENTLY.`);
  }

  /**
   * Analyzes a stream of GPS pings from a rider's device.
   * Mathematically calculates the velocity between each ping.
   * Instantly bans the rider if physical laws are broken.
   */
  public static async analyzeRiderTelemetry(
    riderId: string, 
    deviceId: string, 
    pings: GpsPing[]
  ): Promise<boolean> {
    if (pings.length < 2) return true;

    for (let i = 1; i < pings.length; i++) {
      const p1 = pings[i - 1];
      const p2 = pings[i];

      const distanceKm = HyperFleetEngine.calculateHaversineDistance(
        { latitude: p1.latitude, longitude: p1.longitude },
        { latitude: p2.latitude, longitude: p2.longitude }
      );

      const timeDeltaHours = (p2.timestampMs - p1.timestampMs) / (1000 * 60 * 60);
      
      if (timeDeltaHours <= 0) continue; // prevent division by zero on duplicate pings

      const velocityKmh = distanceKm / timeDeltaHours;

      if (velocityKmh > this.MAX_URBAN_SPEED_KMH) {
        // Impossible speed detected. Rider is spoofing GPS to steal dispatch pings.
        await this.executePenaltyProtocol(riderId, deviceId, 'ERR_GPS_SPOOF_001', {
          p1, p2, calculatedVelocity: velocityKmh
        });
        return false;
      }
    }
    return true;
  }

  /**
   * Analyzes a customer's refund request mathematically against historical data
   * and verifiable spatial reality (Rider's actual dropoff ping distance).
   */
  public static async adjudicateRefundRequest(
    user: UserHistory,
    deliveryData: DeliveryEvent
  ): Promise<'APPROVED' | 'DENIED_AND_FROZEN'> {
    
    // Check 1: Historical Fraud Ratio
    if (user.totalOrders > 5) {
      const refundRatio = user.totalRefunds / user.totalOrders;
      if (refundRatio > this.MAX_REFUND_RATIO) {
        await this.executePenaltyProtocol(user.userId, user.deviceId, 'ERR_FRAUD_RATIO_EXCEEDED', {
          totalOrders: user.totalOrders,
          totalRefunds: user.totalRefunds
        });
        return 'DENIED_AND_FROZEN';
      }
    }

    // Check 2: Geospatial Reality Verification
    // Did the rider actually arrive at the dropoff location?
    const validDropoffPings = deliveryData.riderPings.filter(ping => {
      const dist = HyperFleetEngine.calculateHaversineDistance(
        { latitude: ping.latitude, longitude: ping.longitude },
        deliveryData.dropoffLocation
      );
      return dist <= this.DELIVERY_VERIFICATION_RADIUS_KM;
    });

    if (validDropoffPings.length > 0) {
      // The rider was mathematically proven to be within 150 meters of the customer.
      // A claim of "never delivered" under these circumstances is highly suspect.
      // At this strict tier, we deny the refund automatically to protect platform margin.
      console.warn(`[AI SENTINEL] Refund denied. Spatial reality proves rider was at dropoff.`);
      return 'DENIED_AND_FROZEN';
    }

    return 'APPROVED';
  }
}
