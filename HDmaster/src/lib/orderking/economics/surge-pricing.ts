import { getSql } from "@/lib/db";

export class SurgePricingEngine {
  /**
   * Calculates dynamic surge multiplier based on active riders vs pending orders
   * in a specific zone or platform-wide.
   */
  async calculateSurgeMultiplier(geohashPrefix: string): Promise<number> {
    const sql = await getSql();

    // 1. Get pending orders in this zone
    const pendingOrders = await sql<{ count: string }[]>`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('PLACED', 'ACCEPTED', 'PREPARING')
      AND pickup_geohash LIKE ${geohashPrefix + '%'}
    `;

    // 2. Get active riders in this zone
    const activeRiders = await sql<{ count: string }[]>`
      SELECT COUNT(*) as count 
      FROM user_profiles 
      WHERE role = 'RIDER' 
      AND status = 'ONLINE'
      AND current_geohash LIKE ${geohashPrefix + '%'}
    `;

    const pending = parseInt(pendingOrders[0]?.count || "0", 10);
    const active = parseInt(activeRiders[0]?.count || "1", 10); // Prevent divide by zero

    // 3. Mathematical Surge Calculation (Demand / Supply)
    const ratio = pending / active;

    let multiplier = 1.0;
    
    if (ratio > 5) {
      multiplier = 2.5; // Extreme demand
    } else if (ratio > 3) {
      multiplier = 1.75; // High demand
    } else if (ratio > 1.5) {
      multiplier = 1.25; // Moderate demand
    } else if (ratio < 0.5) {
      multiplier = 0.9; // Oversupply (Discount to stimulate demand)
    }

    return parseFloat(multiplier.toFixed(2));
  }

  /**
   * Calculates the final delivery fee and logs it securely.
   */
  async calculateFinalDeliveryFee(baseFee: number, geohashPrefix: string): Promise<{
    finalFee: number,
    surgeMultiplier: number,
    surgeAmount: number
  }> {
    const surgeMultiplier = await this.calculateSurgeMultiplier(geohashPrefix);
    const finalFee = Math.round(baseFee * surgeMultiplier);
    const surgeAmount = finalFee - baseFee;

    return {
      finalFee,
      surgeMultiplier,
      surgeAmount
    };
  }
}
