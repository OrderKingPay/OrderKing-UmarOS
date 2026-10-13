import { getSql } from "../db.ts";
import { z } from "zod";
import {
  assertPaise,
  addPaise,
  subPaise,
  computeRestaurantPayable,
  STATUTORY_TAX_RATES,
  type SettlementBreakdown,
  type Paise,
} from "../money.ts";

export const SettlementSchema = z.object({
  restaurantId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string(),
});

export const BatchOrderLineSchema = z.object({
  orderId: z.string(),
  foodValuePaise: z.number().int().nonnegative(),
  packingPaise: z.number().int().nonnegative().optional().default(0),
  restaurantDiscountPaise: z.number().int().nonnegative().optional().default(0),
  platformFundedDiscountPaise: z.number().int().nonnegative().optional().default(0),
  commissionBps: z.number().int().nonnegative().optional().default(0),
  otherDeductionsPaise: z.number().int().optional().default(0),
  otherDeductionsCode: z.string().nullable().optional(),
  refundAdjustmentPaise: z.number().int().optional().default(0),
});

export const BatchSettlementInputSchema = z.object({
  restaurantId: z.string().uuid(),
  orders: z.array(BatchOrderLineSchema),
  applyOnboardingFee: z.boolean().optional().default(true),
  amortizedOnboardingFeePaise: z.number().int().nonnegative().optional(),
  idempotencyKey: z.string(),
});

export type BatchSettlementResult = {
  restaurantId: string;
  ordersCount: number;
  lines: Array<{
    orderId: string;
    breakdown: SettlementBreakdown;
  }>;
  totals: {
    totalFoodPaise: Paise;
    totalPackingPaise: Paise;
    totalGrossSalesPaise: Paise;
    totalRestaurantDiscountPaise: Paise;
    totalNetTaxableSupplyPaise: Paise;
    totalPlatformDiscountPaise: Paise;
    totalCommissionPaise: Paise;
    totalCommissionGstPaise: Paise;
    totalCommissionCgstPaise: Paise;
    totalCommissionSgstPaise: Paise;
    totalSec9_5GstPaise: Paise;
    totalSec9_5CgstPaise: Paise;
    totalSec9_5SgstPaise: Paise;
    totalPlatformLiabilitySec9_5Paise: Paise;
    totalTcsSec52Paise: Paise;
    totalTcsCgstPaise: Paise;
    totalTcsSgstPaise: Paise;
    totalTdsSec194OPaise: Paise;
    amortizedOnboardingFeePaise: Paise;
    totalOtherDeductionsPaise: Paise;
    totalRefundAdjustmentPaise: Paise;
    totalDebitedDeductionsPaise: Paise;
    netBatchPayablePaise: Paise;
  };
};

export const settlementEngine = {
  async getPendingBalance(restaurantId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ balance_paise: number }>`
      SELECT balance_paise 
      FROM partner_ledgers 
      WHERE restaurant_id = ${restaurantId}
    `;
    return result[0]?.balance_paise || 0;
  },

  /**
   * Computes statutory weekly batch settlement strictly in integer paise.
   * Aggregates line-by-line food values, packaging charges, restaurant discounts,
   * platform commission with 18% GST (9% CGST + 9% SGST), 5% Section 9(5) CGST liability,
   * 1% Section 52 TCS, 1% Section 194-O TDS, amortized onboarding fee (₹99.00 / 9900 paise),
   * promotional subsidies, and refund adjustments with ZERO floating-point rounding drift.
   */
  calculateBatchSettlement(input: z.input<typeof BatchSettlementInputSchema>): BatchSettlementResult {
    const data = BatchSettlementInputSchema.parse(input);
    const lines = data.orders.map((order) => {
      // Individual order lines do not deduct the per-cycle batch onboarding fee
      const breakdown = computeRestaurantPayable({
        foodValuePaise: order.foodValuePaise,
        packingPaise: order.packingPaise,
        restaurantDiscountPaise: order.restaurantDiscountPaise,
        platformFundedDiscountPaise: order.platformFundedDiscountPaise,
        commissionBps: order.commissionBps,
        otherDeductionsPaise: order.otherDeductionsPaise,
        otherDeductionsCode: order.otherDeductionsCode,
        refundAdjustmentPaise: order.refundAdjustmentPaise,
        applyOnboardingFee: false,
      });
      return {
        orderId: order.orderId,
        breakdown,
      };
    });

    const totalFoodPaise = addPaise(...lines.map((l) => l.breakdown.foodValuePaise), 0);
    const totalPackingPaise = addPaise(...lines.map((l) => l.breakdown.packingPaise), 0);
    const totalGrossSalesPaise = addPaise(...lines.map((l) => l.breakdown.grossSalesPaise), 0);
    const totalRestaurantDiscountPaise = addPaise(...lines.map((l) => l.breakdown.restaurantDiscountPaise), 0);
    const totalNetTaxableSupplyPaise = addPaise(...lines.map((l) => l.breakdown.netTaxableSupplyPaise), 0);
    const totalPlatformDiscountPaise = addPaise(...lines.map((l) => l.breakdown.platformFundedDiscountPaise), 0);
    const totalCommissionPaise = addPaise(...lines.map((l) => l.breakdown.commissionPaise), 0);
    const totalCommissionGstPaise = addPaise(...lines.map((l) => l.breakdown.commissionGstPaise), 0);
    const totalCommissionCgstPaise = addPaise(...lines.map((l) => l.breakdown.commissionCgstPaise), 0);
    const totalCommissionSgstPaise = addPaise(...lines.map((l) => l.breakdown.commissionSgstPaise), 0);
    const totalSec9_5GstPaise = addPaise(...lines.map((l) => l.breakdown.sec9_5GstPaise), 0);
    const totalSec9_5CgstPaise = addPaise(...lines.map((l) => l.breakdown.sec9_5CgstPaise), 0);
    const totalSec9_5SgstPaise = addPaise(...lines.map((l) => l.breakdown.sec9_5SgstPaise), 0);
    const totalPlatformLiabilitySec9_5Paise = totalSec9_5GstPaise;
    const totalTcsSec52Paise = addPaise(...lines.map((l) => l.breakdown.tcsSec52Paise), 0);
    const totalTcsCgstPaise = addPaise(...lines.map((l) => l.breakdown.tcsCgstPaise), 0);
    const totalTcsSgstPaise = addPaise(...lines.map((l) => l.breakdown.tcsSgstPaise), 0);
    const totalTdsSec194OPaise = addPaise(...lines.map((l) => l.breakdown.tdsSec194OPaise), 0);
    const totalOtherDeductionsPaise = addPaise(...lines.map((l) => l.breakdown.otherDeductionsPaise), 0);
    const totalRefundAdjustmentPaise = addPaise(...lines.map((l) => l.breakdown.refundAdjustmentPaise), 0);

    const onboardingFeePaise = data.amortizedOnboardingFeePaise !== undefined
      ? assertPaise(data.amortizedOnboardingFeePaise, "amortizedOnboardingFeePaise")
      : (data.applyOnboardingFee ? STATUTORY_TAX_RATES.AMORTIZED_ONBOARDING_FEE_PAISE : 0);

    const totalOrderPayablePaise = addPaise(...lines.map((l) => l.breakdown.restaurantPayablePaise), 0);
    const netBatchPayablePaise = subPaise(totalOrderPayablePaise, onboardingFeePaise);

    const totalDebitedDeductionsPaise = addPaise(
      totalCommissionPaise,
      totalCommissionGstPaise,
      totalTcsSec52Paise,
      totalTdsSec194OPaise,
      onboardingFeePaise,
      totalOtherDeductionsPaise,
    );

    return {
      restaurantId: data.restaurantId,
      ordersCount: lines.length,
      lines,
      totals: {
        totalFoodPaise,
        totalPackingPaise,
        totalGrossSalesPaise,
        totalRestaurantDiscountPaise,
        totalNetTaxableSupplyPaise,
        totalPlatformDiscountPaise,
        totalCommissionPaise,
        totalCommissionGstPaise,
        totalCommissionCgstPaise,
        totalCommissionSgstPaise,
        totalSec9_5GstPaise,
        totalSec9_5CgstPaise,
        totalSec9_5SgstPaise,
        totalPlatformLiabilitySec9_5Paise,
        totalTcsSec52Paise,
        totalTcsCgstPaise,
        totalTcsSgstPaise,
        totalTdsSec194OPaise,
        amortizedOnboardingFeePaise: onboardingFeePaise,
        totalOtherDeductionsPaise,
        totalRefundAdjustmentPaise,
        totalDebitedDeductionsPaise,
        netBatchPayablePaise,
      },
    };
  },

  async triggerSettlement(input: z.infer<typeof SettlementSchema>) {
    const data = SettlementSchema.parse(input);
    assertPaise(data.amountPaise, "amountPaise");
    const sql = await getSql();
    
    return await sql.transaction(async (tx) => {
      const existing = await tx`
        SELECT 1 FROM settlement_history 
        WHERE idempotency_key = ${data.idempotencyKey}
      `;
      if (existing.length > 0) return { status: "already_processed" };

      const ledgers = await tx<{ balance_paise: number, fund_account_id: string }>`
        SELECT balance_paise, fund_account_id 
        FROM partner_ledgers 
        WHERE restaurant_id = ${data.restaurantId} FOR UPDATE
      `;

      if (ledgers.length === 0) {
        throw new Error("Ledger not found for restaurant");
      }
      
      const ledger = ledgers[0];
      if (ledger.balance_paise < data.amountPaise) {
        throw new Error("Insufficient balance for settlement");
      }

      await tx`
        UPDATE partner_ledgers 
        SET balance_paise = balance_paise - ${data.amountPaise}, 
            updated_at = NOW()
        WHERE restaurant_id = ${data.restaurantId}
      `;

      await tx`
        INSERT INTO settlement_history (restaurant_id, amount_paise, idempotency_key, status)
        VALUES (${data.restaurantId}, ${data.amountPaise}, ${data.idempotencyKey}, 'PROCESSING')
      `;
      const keyId = process.env.RAZORPAY_KEY_ID?.trim();
      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
      if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials missing. Partner settlement is BLOCKED.");
      }
      const token = btoa(`${keyId}:${keySecret}`);
      const res = await fetch("https://api.razorpay.com/v1/transfers", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          account: ledger.fund_account_id,
          amount: data.amountPaise,
          currency: "INR",
          notes: {
            restaurantId: data.restaurantId,
            idempotencyKey: data.idempotencyKey,
          }
        })
      });
      if (!res.ok) {
         throw new Error("Failed to create Razorpay transfer");
      }
      const transfer = await res.json();

      return { status: "processing", transferId: transfer.id };
    });
  }
};
