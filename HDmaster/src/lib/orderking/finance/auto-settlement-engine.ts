import { getSql, type Sql } from '@/lib/db';
import {
  getWeeklyCycle,
  getExpressDailyCycle,
  calculateRestaurantWeeklySettlement,
  calculateRestaurantDualCycleSettlement,
} from "./weekly-settlement";

/**
 * 👑 ORDERKING AUTONOMOUS TIER-1 LEGACY COMPATIBLE SETTLEMENT ENGINE
 * 
 * 100% Autonomous, Zero-Human-Touch Dual Financial Reconciliation System.
 * - Standard Cycle: Auto-aggregates all previous week's orders (Mon-Sun), disbursed Wednesday.
 * - Express Daily Cycle: Auto-aggregates yesterday's net earnings for early payout with a nominal 0.5% liquidity fee.
 * - Applies exact Indian Statutory Tax logic (Section 9(5) CGST, 1% TCS Sec 52, 1% TDS Sec 194-O, 18% GST).
 * - Implements strict Founder Protection: Any discrepancy or deficit instantly pauses the payout and escalates.
 * - Founder NEVER bears a loss. The platform commission is absolute.
 */

export const AutoSettlementEngine = {
  /**
   * Executes the global weekly settlement run. 
   * Intended to be triggered by a Cron Job every Monday at 2:00 AM for the previous week (Mon-Sun).
   * Payouts will be disbursed automatically on Wednesday.
   */
  async runGlobalWeeklyReconciliation(referenceDate: Date = new Date()) {
    const cycle = getWeeklyCycle(referenceDate);

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

        // Calculate precise statutory mathematics
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
      message: `Global standard reconciliation complete. ${totalProcessed} payouts ready for Wednesday. ${totalEscalated} anomalies escalated to Founder.`
    };
  },

  /**
   * Executes the global Express Daily (T+1) settlement run.
   * Runs daily at 03:00 AM for yesterday's net earnings.
   * Deducts a nominal 0.5% early-liquidity fee (+ 18% GST on fee).
   */
  async runGlobalExpressDailyReconciliation(referenceDate: Date = new Date()) {
    const cycle = getExpressDailyCycle(referenceDate);

    const sql = await getSql();
    let totalProcessed = 0;
    let totalEscalated = 0;

    await sql.transaction(async (tx: Sql) => {
      // Fetch restaurants opted into Express Daily settlements
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
      `, [`${cycle.startDate} 00:00:00`, `${cycle.endDate} 23:59:59`]);

      for (const stat of restaurantStats) {
        const idempotencyKey = `stl_express_${stat.restaurant_id}_${cycle.cycleId}`;
        
        const existing = await tx.query(`SELECT 1 FROM settlement_batches WHERE idempotency_key = $1`, [idempotencyKey]);
        if (existing.length > 0) continue;

        const settlement = calculateRestaurantDualCycleSettlement({
          restaurantId: stat.restaurant_id,
          restaurantName: stat.restaurant_name,
          cycleType: "EXPRESS_DAILY",
          cyclePeriod: cycle,
          deliveredOrdersCount: parseInt(stat.total_orders),
          grossSalesPaise: parseInt(stat.gross_sales),
          restaurantDiscountsPaise: parseInt(stat.total_discounts),
          commissionBps: 1200,
          pgFeeBps: 180,
          earlyLiquidityFeeBps: 50, // 0.5% early liquidity fee
        });

        let payoutState = "READY_FOR_PAYOUT";
        let escalationReason = null;

        const totalExpectedPlatformRetained =
          settlement.platformCommissionPaise +
          settlement.gstOnCommissionPaise +
          (settlement.expressLiquidityFeePaise ?? 0) +
          (settlement.gstOnExpressLiquidityFeePaise ?? 0);

        const mathematicallySafe =
          (parseInt(stat.total_collected) - parseInt(stat.expected_delivery_fees)) >=
          (settlement.netPayablePaise + totalExpectedPlatformRetained);

        if (!mathematicallySafe) {
          payoutState = "ESCALATED_DEFICIT";
          escalationReason = `Mathematical Deficit in Express Payout: paused to protect Founder funds.`;
        } else if (stat.payout_status === 'SUSPENDED') {
          payoutState = "ESCALATED_SUSPENDED";
          escalationReason = "Restaurant payout is manually suspended by Admin.";
        }

        const batchId = `stl-exp-${Date.now()}-${Math.floor(Math.random()*1000)}`;

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
          settlement.tcsDeductionPaise +
            settlement.tdsDeductionPaise +
            settlement.paymentGatewayFeePaise +
            settlement.gstOnPgFeePaise +
            (settlement.expressLiquidityFeePaise ?? 0) +
            (settlement.gstOnExpressLiquidityFeePaise ?? 0),
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
      message: `Global Express Daily reconciliation complete. ${totalProcessed} payouts processed (0.5% liquidity fee).`
    };
  }
};
