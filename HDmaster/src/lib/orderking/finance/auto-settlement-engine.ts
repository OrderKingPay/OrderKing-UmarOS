import { getSql, type Sql } from "../../db";
import { getWeeklyCycle, calculateRestaurantWeeklySettlement } from "./weekly-settlement";

/**
 * 👑 ORDERKING AUTONOMOUS ZOMATO-STYLE SETTLEMENT ENGINE
 * 
 * 100% AI-Managed, 0-Human-Touch Financial Reconciliation System.
 * - Auto-aggregates all previous week's orders for every restaurant & rider.
 * - Applies exact Indian Tax logic (1% TDS, 1% TCS, 18% GST).
 * - Implements strict Founder Protection: Any discrepancy or deficit instantly pauses the payout and escalates.
 * - Founder NEVER bears a loss. The platform commission is absolute.
 */

export const AutoSettlementEngine = {
  /**
   * Executes the global weekly settlement run. 
   * Intended to be triggered by a Cron Job every Monday at 2:00 AM for the previous week (Mon-Sun).
   * Payouts will be disbursed automatically on Wednesday (Zomato cycle).
   */
  async runGlobalWeeklyReconciliation(referenceDate: Date = new Date()) {
    const cycle = getWeeklyCycle(referenceDate);
    // In reality, if today is Monday, we reconcile the *previous* week.
    // The cycle logic in getWeeklyCycle is based on the reference date.

    const sql = await getSql();
    let totalProcessed = 0;
    let totalEscalated = 0;

    await sql.transaction(async (tx: Sql) => {
      // 1. Fetch all restaurants with active orders in this cycle
      const restaurantStats = await tx.query<any>(`
        SELECT 
          r.id as restaurant_id, 
          r.name as restaurant_name,
          r.payout_status,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.food_paise), 0) as gross_sales,
          COALESCE(SUM(o.restaurant_discount_paise), 0) as total_discounts,
          COALESCE(SUM(o.commission_paise), 0) as expected_commission,
          COALESCE(SUM(o.delivery_fee_paise), 0) as expected_delivery_fees,
          COALESCE(SUM(o.total_paise), 0) as total_collected
        FROM restaurants r
        JOIN orders o ON o.restaurant_id = r.id
        WHERE o.status = 'DELIVERED' 
          AND o.placed_at >= $1 
          AND o.placed_at <= $2
        GROUP BY r.id, r.name, r.payout_status
      `, [cycle.startDate, cycle.endDate]);

      for (const stat of restaurantStats) {
        const idempotencyKey = `stl_rest_${stat.restaurant_id}_${cycle.cycleId}`;
        
        // Prevent duplicate runs
        const existing = await tx.query(`SELECT 1 FROM settlement_batches WHERE idempotency_key = $1`, [idempotencyKey]);
        if (existing.length > 0) continue;

        // Calculate precise Zomato-level mathematics
        const settlement = calculateRestaurantWeeklySettlement({
          restaurantId: stat.restaurant_id,
          restaurantName: stat.restaurant_name,
          cycle: cycle,
          deliveredOrdersCount: parseInt(stat.total_orders),
          grossSalesPaise: parseInt(stat.gross_sales),
          restaurantDiscountsPaise: parseInt(stat.total_discounts),
          commissionBps: 1200, // 12% commission
          pgFeeBps: 180, // 1.8% PG fee
        });

        // ==========================================
        // 🛡️ FOUNDER PROTECTION ALGORITHM 🛡️
        // ==========================================
        // We verify that the actual collected money minus rider payouts 
        // can comfortably cover the restaurant's net payout AND the founder's commission.
        // If the system detects ANY anomaly (e.g. cash on delivery not remitted, system error),
        // we lock the funds, protect the founder, and escalate.
        
        let payoutState = "READY_FOR_PAYOUT";
        let escalationReason = null;

        const totalExpectedPlatformRetained = settlement.platformCommissionPaise + settlement.gstOnCommissionPaise;
        const mathematicallySafe = (parseInt(stat.total_collected) - parseInt(stat.expected_delivery_fees)) >= (settlement.netPayablePaise + totalExpectedPlatformRetained);

        if (!mathematicallySafe) {
          payoutState = "ESCALATED_DEFICIT";
          escalationReason = `Mathematical Deficit Detected: Total Collected (₹${parseInt(stat.total_collected)/100}) - Delivery (₹${parseInt(stat.expected_delivery_fees)/100}) is LESS than Net Payable (₹${settlement.netPayablePaise/100}) + Platform Commission (₹${totalExpectedPlatformRetained/100}). Payout paused to protect Founder funds.`;
        } else if (stat.payout_status === 'SUSPENDED') {
          payoutState = "ESCALATED_SUSPENDED";
          escalationReason = "Restaurant payout is manually suspended by Admin.";
        } else if (settlement.netPayablePaise < 0) {
          payoutState = "ESCALATED_NEGATIVE";
          escalationReason = "Restaurant owes the platform money. Must be adjusted next cycle.";
        }

        // Generate Batch ID
        const batchId = `stl-${Date.now()}-${Math.floor(Math.random()*1000)}`;

        // Insert into settlement ledger
        await tx.query(`
          INSERT INTO settlement_batches (
            batch_id, entity_id, entity_type, period_start, period_end, 
            gross_amount_paise, deductions_paise, commission_paise, gst_paise, 
            net_payout_paise, state, idempotency_key, payout_upi_or_account_number, 
            attempts_count, notes
          ) VALUES ($1, $2, 'RESTAURANT', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, $13)
        `, [
          batchId,
          stat.restaurant_id,
          cycle.startDate,
          cycle.endDate,
          settlement.grossSalesPaise,
          settlement.tcsDeductionPaise + settlement.tdsDeductionPaise + settlement.paymentGatewayFeePaise + settlement.gstOnPgFeePaise,
          settlement.platformCommissionPaise,
          settlement.gstOnCommissionPaise,
          settlement.netPayablePaise,
          payoutState,
          idempotencyKey,
          settlement.bankAccountNumberMasked,
          escalationReason
        ]);

        if (payoutState.startsWith("ESCALATED")) {
          totalEscalated++;
        } else {
          totalProcessed++;
        }
      }
    });

    return {
      success: true,
      cycle: cycle.cycleId,
      processed: totalProcessed,
      escalated: totalEscalated,
      message: `Global reconciliation complete. ${totalProcessed} payouts ready for Wednesday. ${totalEscalated} anomalies escalated to Founder.`
    };
  }
};
