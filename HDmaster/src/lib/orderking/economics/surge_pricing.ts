import { Kysely, sql } from 'kysely';

// Assuming generic DB type for the schema
export interface DB {
  orders: any;
  zones: any;
}

/**
 * Calculates surge multiplier based on active order density and IST Peak Hours.
 * Peak hours: Lunch (12:00-15:00 IST), Dinner (19:00-23:00 IST)
 */
export async function calculateSurgeMultiplier(db: Kysely<DB>, zoneId: string): Promise<number> {
    // 1. Calculate Active Order Density for the specific zone
    const densityQuery = await db
        .selectFrom('orders')
        .select([
            sql<number>`COUNT(id)`.as('active_orders')
        ])
        .where('zone_id', '=', zoneId)
        .where('status', 'in', ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY'])
        .where(sql`created_at`, '>=', sql`NOW() - INTERVAL '30 MINUTE'`)
        .executeTakeFirst();

    const activeOrders = densityQuery?.active_orders || 0;
    
    // 2. IST Hour extraction using Postgres AT TIME ZONE
    const timeCheck = await db.selectNoFrom((eb) => [
        sql<number>`EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Asia/Kolkata')`.as('ist_hour')
    ]).executeTakeFirst();

    const hour = timeCheck?.ist_hour || 0;

    // 3. Base Time Surge
    let baseMultiplier = 1.0;
    if ((hour >= 12 && hour <= 15) || (hour >= 19 && hour <= 23)) {
        baseMultiplier = 1.5; // High demand meal times
    } else if (hour >= 23 || hour <= 4) {
        baseMultiplier = 1.25; // Late night surcharge
    }

    // 4. Density Modifier: +0.15 multiplier for every 50 concurrent active orders in the zone
    const densityModifier = Math.floor(activeOrders / 50) * 0.15;
    
    // 5. Final Calculation with bounds (Max Surge Cap = 3.5x)
    return Math.min(3.5, baseMultiplier + densityModifier);
}

/**
 * Applies the current surge pricing multiplier directly to an order's delivery fee.
 */
export async function applySurgeToDeliveryFee(db: Kysely<DB>, orderId: string, zoneId: string) {
    const multiplier = await calculateSurgeMultiplier(db, zoneId);
    
    await db.updateTable('orders')
        .set((eb) => ({
            delivery_fee: sql`delivery_fee * ${multiplier}`,
            surge_multiplier: multiplier
        }))
        .where('id', '=', orderId)
        .execute();
        
    return multiplier;
}
