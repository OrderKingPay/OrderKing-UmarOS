import { getSql } from '@/lib/db';
import { forecastNextHourDemand } from '../data/demand-forecaster';

export async function calculateDynamicDeliveryFee(baseFeePaise: number, zoneId: string): Promise<number> {
    const sql = await getSql();

    // Forecast demand (number of riders needed)
    const forecastedRiders = await forecastNextHourDemand(zoneId);

    // Get available riders in the zone
    const availableResult = await sql`
        SELECT count(id) as count
        FROM riders
        WHERE zone_id = ${zoneId} AND status IN ('ACTIVE', 'ONLINE')
    `;
    
    const availableRiders = availableResult[0]?.count ? Number(availableResult[0].count) : 0;

    let multiplier = 1.0;
    
    // Apply strict mathematical formula if forecasted > available
    if (forecastedRiders > availableRiders) {
        if (availableRiders === 0) {
            multiplier = 2.5; // Max cap when no riders are available
        } else {
            // Apply a multiplier scaling with the shortage ratio
            const ratio = forecastedRiders / availableRiders;
            // e.g., if ratio is 1.5, multiplier = 1.5. if ratio is 2, multiplier is 2.
            multiplier = Math.min(2.5, ratio);
        }
    }

    // Real integer math in paise
    const finalFee = Math.floor(baseFeePaise * multiplier);

    // Log the applied surge multiplier to the DB for audit compliance
    try {
        await sql`
            INSERT INTO audit_surge_logs (zone_id, base_fee_paise, forecasted_riders, available_riders, multiplier, final_fee_paise, created_at)
            VALUES (${zoneId}, ${baseFeePaise}, ${forecastedRiders}, ${availableRiders}, ${multiplier}, ${finalFee}, NOW())
        `;
    } catch (err) {
        // Fallback if the audit table doesn't exist, to avoid breaking the application flow.
        // Ideally the table should be created via migrations.
        console.warn('Failed to log surge to DB (audit_surge_logs table might be missing):', err);
    }

    return finalFee;
}
