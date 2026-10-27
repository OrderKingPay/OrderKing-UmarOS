import { getSql, type Sql } from '../../db.ts';
import {
  getWeeklyCycle,
  getExpressDailyCycle,
  getDailyTPlus1Cycle,
  calculateRestaurantWeeklySettlement,
  calculateRestaurantDualCycleSettlement,
} from "./weekly-settlement";
import { executeRazorpayXPayout } from "./razorpayx-payout-engine";
import { canonicalLedger } from "./canonical-ledger";
import { validateIndianBankIFSC } from "../compliance/india-marketplace-engine";

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
  },

  /**
   * 🌅 T+1 DAILY AUTOMATED PAYOUT DISBURSEMENT ENGINE
   * 
   * Mandate: All sales/deliveries recorded up to 23:59:59 IST (Day T) are batched
   * and disbursed automatically the following morning (Day T+1 10:00 AM IST) via RazorpayX IMPS/UPI/NEFT.
   * Covers BOTH Restaurant Partners and Fleet Riders.
   * Zero manual bottleneck failures. Direct real banking execution.
   */
  async runGlobalDailyTPlus1Settlement(referenceDate: Date = new Date(), autoDisburse: boolean = true) {
    const cycle = getDailyTPlus1Cycle(referenceDate);
    const sql = await getSql();

    let totalProcessed = 0;
    let totalEscalated = 0;
    let totalDisbursedPaise = 0;
    let restaurantCount = 0;
    let riderCount = 0;

    const periodStart = `${cycle.startDate} 00:00:00Z`;
    const periodEnd = `${cycle.endDate} 23:59:59Z`;

    // -------------------------------------------------------------------------
    // 1. RESTAURANT PARTNERS T+1 DAILY SETTLEMENT
    // -------------------------------------------------------------------------
    const restaurantStats = await sql.query<any>(`
      SELECT 
        r.id as restaurant_id, 
        r.name as restaurant_name,
        r.payout_status,
        r.bank_account,
        r.bank_ifsc,
        r.bank_name,
        r.payout_vpa,
        r.commission_bps,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.food_paise), 0) as gross_sales,
        COALESCE(SUM(o.restaurant_discount_paise), 0) as total_discounts,
        COALESCE(SUM(o.commission_paise), 0) as expected_commission,
        COALESCE(SUM(o.delivery_fee_paise), 0) as expected_delivery_fees,
        COALESCE(SUM(o.total_paise), 0) as total_collected
      FROM restaurants r
      JOIN orders o ON o.restaurant_id = r.id
      WHERE o.status = 'DELIVERED' 
        AND o.placed_at <= $1::timestamptz
        AND NOT EXISTS (
          SELECT 1 FROM settlement_batches sb 
          WHERE (sb.party_id = r.id OR sb.entity_id = r.id) 
            AND sb.period_end >= o.placed_at 
            AND sb.status IN ('PAID', 'PROCESSING')
        )
      GROUP BY r.id, r.name, r.payout_status, r.bank_account, r.bank_ifsc, r.bank_name, r.payout_vpa, r.commission_bps
    `, [periodEnd]);

    for (const stat of restaurantStats) {
      const deliveredCount = parseInt(stat.total_orders || "0", 10);
      const grossSalesPaise = parseInt(stat.gross_sales || "0", 10);
      if (deliveredCount === 0 || grossSalesPaise <= 0) continue;

      const idempotencyKey = `stl_daily_rest_${stat.restaurant_id}_${cycle.cycleId}`;
      const existing = await sql.query<any>(
        `SELECT id, batch_id, status FROM settlement_batches WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey]
      );
      if (existing.length > 0 && (existing[0].status === "PAID" || existing[0].status === "PROCESSING")) {
        continue;
      }

      const commissionBps = parseInt(stat.commission_bps || "1000", 10);
      const settlement = calculateRestaurantWeeklySettlement({
        restaurantId: stat.restaurant_id,
        restaurantName: stat.restaurant_name,
        cycle: {
          cycleId: cycle.cycleId,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          payoutDate: cycle.payoutDate,
          status: "OPEN",
        },
        deliveredOrdersCount: deliveredCount,
        grossSalesPaise,
        restaurantDiscountsPaise: parseInt(stat.total_discounts || "0", 10),
        commissionBps,
        pgFeeBps: 180,
      });

      const netPayablePaise = settlement.netPayablePaise;
      let payoutState = "READY_FOR_PAYOUT";
      let escalationReason: string | null = null;

      // 🛡️ FOUNDER PROTECTION ALGORITHM: 0% RISK OF UNBACKED DISBURSEMENT 🛡️
      const totalExpectedPlatformRetained = settlement.platformCommissionPaise + settlement.gstOnCommissionPaise;
      const totalCollected = parseInt(stat.total_collected || "0", 10);
      const deliveryFees = parseInt(stat.expected_delivery_fees || "0", 10);
      const mathematicallySafe = (totalCollected - deliveryFees) >= (netPayablePaise + totalExpectedPlatformRetained);

      const hasVpa = Boolean(stat.payout_vpa?.trim());
      const hasBank = Boolean(stat.bank_account?.trim() && stat.bank_ifsc?.trim());

      if (!mathematicallySafe) {
        payoutState = "ESCALATED_DEFICIT";
        escalationReason = `Mathematical Deficit Detected: Total Collected (₹${(totalCollected / 100).toFixed(2)}) minus Delivery Fees (₹${(deliveryFees / 100).toFixed(2)}) is LESS than Net Payable (₹${(netPayablePaise / 100).toFixed(2)}) + Platform Commission (₹${(totalExpectedPlatformRetained / 100).toFixed(2)}). Payout halted to protect Founder capital.`;
      } else if (stat.payout_status === "SUSPENDED") {
        payoutState = "ESCALATED_SUSPENDED";
        escalationReason = "Restaurant payout is manually suspended by Admin.";
      } else if (netPayablePaise <= 0) {
        payoutState = "ESCALATED_ZERO";
        escalationReason = "Net payable is zero after statutory deductions.";
      } else if (!hasVpa && !hasBank) {
        payoutState = "ESCALATED_NO_BANK_DETAILS";
        escalationReason = "Restaurant partner has not provided active Bank Account/IFSC or UPI VPA.";
      } else if (!hasVpa && stat.bank_ifsc?.trim()) {
        const ifscCheck = validateIndianBankIFSC(stat.bank_ifsc);
        if (!ifscCheck.isValid) {
          payoutState = "ESCALATED_INVALID_IFSC";
          escalationReason = `Invalid Bank IFSC (${stat.bank_ifsc}): ${ifscCheck.error || "Malformed 11-char IFSC code"}`;
        }
      }

      const batchId = `stl-dly-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const destinationMasked = stat.payout_vpa || (stat.bank_account ? `A/C ${String(stat.bank_account).slice(-4)}` : "NO_BANK_DETAILS");

      await sql.query(`
        INSERT INTO settlement_batches (
          id, batch_id, org_id, party_type, entity_type, party_id, entity_id, party_name,
          period_start, period_end, gross_paise, gross_amount_paise, fee_paise, deductions_paise,
          commission_paise, gst_paise, net_paise, net_payout_paise, payable_paise,
          status, state, idempotency_key, payout_upi_or_account_number, attempts_count, reason, notes, created_at, updated_at
        ) VALUES (
          $1, $1, 'default', 'RESTAURANT', 'RESTAURANT', $2, $2, $3,
          $4::timestamptz, $5::timestamptz, $6, $6, $7, $7,
          $8, $9, $10, $10, $10,
          $11, $11, $12, $13, 0, $14, $14, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          net_paise = $10, net_payout_paise = $10, payable_paise = $10,
          status = $11, updated_at = NOW()
      `, [
        batchId,
        stat.restaurant_id,
        stat.restaurant_name,
        periodStart,
        periodEnd,
        settlement.grossSalesPaise,
        settlement.tcsDeductionPaise + settlement.tdsDeductionPaise + settlement.paymentGatewayFeePaise + settlement.gstOnPgFeePaise,
        settlement.platformCommissionPaise,
        settlement.gstOnCommissionPaise,
        netPayablePaise,
        payoutState,
        idempotencyKey,
        destinationMasked,
        escalationReason,
      ]);

      if (payoutState.startsWith("ESCALATED")) {
        totalEscalated++;
        continue;
      }

      restaurantCount++;
      totalProcessed++;

      // Automated Disbursement via RazorpayX with Partial Failure Isolation
      if (autoDisburse && netPayablePaise > 0) {
        let beneficiaryInput: any = null;
        if (stat.payout_vpa?.trim()) {
          beneficiaryInput = { vpa: stat.payout_vpa.trim(), name: stat.restaurant_name };
        } else if (stat.bank_account?.trim() && stat.bank_ifsc?.trim()) {
          beneficiaryInput = {
            accountNumber: stat.bank_account.trim(),
            ifsc: stat.bank_ifsc.trim(),
            name: stat.restaurant_name,
          };
        }

        if (beneficiaryInput) {
          const payoutRes = await executeRazorpayXPayout({
            beneficiary: beneficiaryInput,
            amountPaise: netPayablePaise,
            referenceId: batchId,
            idempotencyKey,
            narration: `OrderKing T+1 Payout: ${stat.restaurant_name.slice(0, 15)}`,
            purpose: "settlement",
            notes: { restaurantId: stat.restaurant_id, cycle: cycle.cycleId },
          });

          if (payoutRes.success) {
            const finalStatus = payoutRes.status === "processed" ? "PAID" : "PROCESSING";
            await sql.query(`
              UPDATE settlement_batches
              SET status = $1, state = $1,
                  external_reference = $2, provider_reference = $3,
                  paid_at = CASE WHEN $1 = 'PAID' THEN NOW() ELSE paid_at END,
                  updated_at = NOW()
              WHERE id = $4
            `, [finalStatus, payoutRes.payoutId || batchId, payoutRes.utr || null, batchId]);

            totalDisbursedPaise += netPayablePaise;
          } else {
            // Partial bank failure isolated: batch marked FAILED, money NOT disbursed, founder funds protected
            console.error(`[AutoSettlementEngine] Restaurant payout ${batchId} failed: ${payoutRes.failureReason}`);
            await sql.query(`
              UPDATE settlement_batches
              SET status = 'FAILED', state = 'FAILED',
                  failure_reason = $1,
                  updated_at = NOW()
              WHERE id = $2
            `, [payoutRes.failureReason || "RazorpayX dispatch rejected", batchId]);
            totalEscalated++;
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. FLEET RIDERS T+1 DAILY SETTLEMENT
    // -------------------------------------------------------------------------
    const riderStats = await sql.query<any>(`
      SELECT 
        rd.id as rider_id,
        rd.name as rider_name,
        rd.payout_upi,
        rd.bank_account,
        rd.bank_ifsc,
        rd.cash_collected_paise,
        COUNT(o.id) as total_trips,
        COALESCE(SUM(CASE WHEN o.rider_payout_paise > 0 THEN o.rider_payout_paise ELSE o.delivery_fee_paise END), 0) as gross_delivery_paise
      FROM riders rd
      JOIN orders o ON o.rider_id = rd.id
      WHERE o.status = 'DELIVERED'
        AND o.placed_at <= $1::timestamptz
        AND NOT EXISTS (
          SELECT 1 FROM settlement_batches sb
          WHERE (sb.party_id = rd.id OR sb.entity_id = rd.id)
            AND sb.period_end >= o.placed_at
            AND sb.status IN ('PAID', 'PROCESSING')
        )
      GROUP BY rd.id, rd.name, rd.payout_upi, rd.bank_account, rd.bank_ifsc, rd.cash_collected_paise
    `, [periodEnd]);

    for (const rStat of riderStats) {
      const totalTrips = parseInt(rStat.total_trips || "0", 10);
      const grossDeliveryPaise = parseInt(rStat.gross_delivery_paise || "0", 10);
      if (totalTrips === 0 || grossDeliveryPaise <= 0) continue;

      const cashOffset = parseInt(rStat.cash_collected_paise || "0", 10);
      const netRiderPaise = Math.max(0, grossDeliveryPaise - cashOffset);
      if (netRiderPaise <= 0) continue;

      const idempotencyKey = `stl_daily_rider_${rStat.rider_id}_${cycle.cycleId}`;
      const existing = await sql.query<any>(
        `SELECT id, batch_id, status FROM settlement_batches WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey]
      );
      if (existing.length > 0 && (existing[0].status === "PAID" || existing[0].status === "PROCESSING")) {
        continue;
      }

      const hasRiderUpi = Boolean(rStat.payout_upi?.trim());
      const hasRiderBank = Boolean(rStat.bank_account?.trim() && rStat.bank_ifsc?.trim());
      let riderPayoutState = "READY_FOR_PAYOUT";
      let riderEscalationReason: string | null = null;

      if (!hasRiderUpi && !hasRiderBank) {
        riderPayoutState = "ESCALATED_NO_BANK_DETAILS";
        riderEscalationReason = "Fleet rider has not registered a verified UPI VPA or active Bank Account.";
      } else if (!hasRiderUpi && rStat.bank_ifsc?.trim()) {
        const ifscCheck = validateIndianBankIFSC(rStat.bank_ifsc);
        if (!ifscCheck.isValid) {
          riderPayoutState = "ESCALATED_INVALID_IFSC";
          riderEscalationReason = `Invalid Rider Bank IFSC (${rStat.bank_ifsc}): ${ifscCheck.error || "Malformed 11-char IFSC code"}`;
        }
      }

      const batchId = `stl-rdr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const destinationMasked = rStat.payout_upi || (rStat.bank_account ? `A/C ${String(rStat.bank_account).slice(-4)}` : "NO_UPI_REGISTERED");

      await sql.query(`
        INSERT INTO settlement_batches (
          id, batch_id, org_id, party_type, entity_type, party_id, entity_id, party_name,
          period_start, period_end, gross_paise, gross_amount_paise, fee_paise, deductions_paise,
          commission_paise, gst_paise, net_paise, net_payout_paise, payable_paise,
          status, state, idempotency_key, payout_upi_or_account_number, attempts_count, reason, notes, created_at, updated_at
        ) VALUES (
          $1, $1, 'default', 'RIDER', 'RIDER', $2, $2, $3,
          $4::timestamptz, $5::timestamptz, $6, $6, 0, 0,
          0, 0, $7, $7, $7,
          $8, $8, $9, $10, 0, $11, $11, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          net_paise = $7, net_payout_paise = $7, payable_paise = $7,
          status = $8, updated_at = NOW()
      `, [
        batchId,
        rStat.rider_id,
        rStat.rider_name,
        periodStart,
        periodEnd,
        grossDeliveryPaise,
        netRiderPaise,
        riderPayoutState,
        idempotencyKey,
        destinationMasked,
        riderEscalationReason,
      ]);

      if (riderPayoutState.startsWith("ESCALATED")) {
        totalEscalated++;
        continue;
      }

      riderCount++;
      totalProcessed++;

      if (autoDisburse && netRiderPaise > 0) {
        let riderBeneficiary: any = null;
        if (rStat.payout_upi?.trim()) {
          riderBeneficiary = { vpa: rStat.payout_upi.trim(), name: rStat.rider_name };
        } else if (rStat.bank_account?.trim() && rStat.bank_ifsc?.trim()) {
          riderBeneficiary = {
            accountNumber: rStat.bank_account.trim(),
            ifsc: rStat.bank_ifsc.trim(),
            name: rStat.rider_name,
          };
        }

        if (riderBeneficiary) {
          const payoutRes = await executeRazorpayXPayout({
            beneficiary: riderBeneficiary,
            amountPaise: netRiderPaise,
            referenceId: batchId,
            idempotencyKey,
            narration: `OrderKing Rider T+1 Pay: ${rStat.rider_name.slice(0, 15)}`,
            purpose: "settlement",
            mode: rStat.payout_upi ? "UPI" : "IMPS",
            notes: { riderId: rStat.rider_id, cycle: cycle.cycleId },
          });

          if (payoutRes.success) {
            const finalStatus = payoutRes.status === "processed" ? "PAID" : "PROCESSING";
            await sql.query(`
              UPDATE settlement_batches
              SET status = $1, state = $1,
                  external_reference = $2, provider_reference = $3,
                  paid_at = CASE WHEN $1 = 'PAID' THEN NOW() ELSE paid_at END,
                  updated_at = NOW()
              WHERE id = $4
            `, [finalStatus, payoutRes.payoutId || batchId, payoutRes.utr || null, batchId]);

            totalDisbursedPaise += netRiderPaise;
          } else {
            console.error(`[AutoSettlementEngine] Rider payout ${batchId} failed: ${payoutRes.failureReason}`);
            await sql.query(`
              UPDATE settlement_batches
              SET status = 'FAILED', state = 'FAILED',
                  failure_reason = $1,
                  updated_at = NOW()
              WHERE id = $2
            `, [payoutRes.failureReason || "RazorpayX dispatch rejected", batchId]);
            totalEscalated++;
          }
        }
      }
    }

    return {
      success: true,
      cycle: cycle.cycleId,
      processed: totalProcessed,
      escalated: totalEscalated,
      restaurantCount,
      riderCount,
      totalDisbursedPaise,
      message: `T+1 Daily Automated Settlement Complete. ${restaurantCount} restaurants and ${riderCount} riders processed. ₹${(totalDisbursedPaise / 100).toFixed(2)} disbursed.`,
    };
  }
};
