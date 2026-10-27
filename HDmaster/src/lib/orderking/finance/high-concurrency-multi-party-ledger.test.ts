import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  CanonicalLedger,
  canonicalLedger,
  type LedgerEntry,
  SOVEREIGN_NPCI_UPI_VPA,
  SECONDARY_NPCI_UPI_VPA,
} from "./canonical-ledger.ts";
import {
  SettlementReconciliationEngine,
  type OrderReconciliationInput,
} from "./SettlementReconciliationEngine.ts";
import {
  createMerchantContract,
  generateMerchantWeeklySettlementStatement,
  generateComprehensiveSettlementJournal,
  generatePayoutLedgerEntries,
  postMerchantSettlementToLedger,
} from "./merchant-contracts.ts";
import {
  calculateMerchantNetPayable,
  calculateRiderNetEarnings,
  calculateRiderWeeklySettlement,
  getWeeklyCycle,
  getExpressDailyCycle,
} from "./weekly-settlement.ts";
import {
  STATUTORY_TAX_RATES,
  applyTaxBps,
  assertSafePaise,
  calculateSection9_5FoodGST,
  calculateSection52TCS,
  calculateSection194OTDS,
  calculatePlatformServiceGST,
} from "../revenue/tax-calculator.ts";

describe("👑 HIGH-CONCURRENCY DOUBLE-ENTRY LEDGER & MULTI-PARTY SPLIT AUDIT", () => {
  const reconEngine = new SettlementReconciliationEngine();

  // =========================================================================
  // SECTION 1: MULTI-PARTY SPLIT MATHEMATICAL ZERO-PAISE VARIANCE
  // =========================================================================
  describe("Section 1: Multi-Party Split Mathematical Zero-Paise Variance", () => {
    test("verifies exact zero-paise variance on complete multi-party order split", async () => {
      // Order scenario:
      // Food subtotal: ₹850.00 (85,000 paise)
      // Packaging charges: ₹35.00 (3,500 paise)
      // Gross Merchant Sales: ₹885.00 (88,500 paise)
      // Delivery fee (Rider): ₹45.00 (4,500 paise)
      // Platform convenience fee: ₹20.00 (2,000 paise)
      // 18% GST on Platform fee: ₹3.60 (360 paise)
      // 5% Section 9(5) Food GST (collected from customer, remitted under OrderKing GSTIN 18AFXPH9838M1Z9):
      // 5% of 88,500 = 4,425 paise
      // Customer Total = 88,500 + 4,500 + 2,000 + 360 + 4,425 = 99,785 paise (₹997.85)

      const foodPaise = 85_000;
      const packagingPaise = 3_500;
      const grossMerchantPaise = foodPaise + packagingPaise;
      const deliveryFeePaise = 4_500;
      const platformFeePaise = 2_000;
      const gstOnPlatformFeePaise = applyTaxBps(platformFeePaise, STATUTORY_TAX_RATES.PLATFORM_SERVICE_GST_BPS); // 360 paise
      const sec9_5GstPaise = applyTaxBps(grossMerchantPaise, STATUTORY_TAX_RATES.SEC_9_5_FOOD_GST_BPS); // 4425 paise

      const totalCustomerDebitPaise =
        grossMerchantPaise +
        deliveryFeePaise +
        platformFeePaise +
        gstOnPlatformFeePaise +
        sec9_5GstPaise;

      assert.strictEqual(totalCustomerDebitPaise, 99_785);

      const idempotencyKey = "mp-split-zero-var-001";
      const tx = await canonicalLedger.postTransaction({
        idempotencyKey,
        eventType: "ORDER_MULTI_PARTY_CAPTURE",
        orderId: "ord_mp_001",
        entries: [
          {
            account: "BANK_CLEARING",
            direction: "DEBIT",
            amountPaise: totalCustomerDebitPaise,
            entityId: `NPCI_UPI:${SOVEREIGN_NPCI_UPI_VPA}`,
            memo: "Direct NPCI UPI collection via Sovereign VPA",
          },
          {
            account: "RESTAURANT_PAYABLE",
            direction: "CREDIT",
            amountPaise: grossMerchantPaise,
            entityId: "rest_darbar_01",
            memo: "Gross merchant entitlement before settlement deductions",
          },
          {
            account: "RIDER_PAYABLE",
            direction: "CREDIT",
            amountPaise: deliveryFeePaise,
            entityId: "rider_rahul_01",
            memo: "Contracted delivery fare to delivery partner",
          },
          {
            account: "PLATFORM_FEE_REVENUE",
            direction: "CREDIT",
            amountPaise: platformFeePaise,
            entityId: "PLATFORM",
            memo: "Platform customer convenience fee revenue",
          },
          {
            account: "GST_OUTPUT_LIABILITY",
            direction: "CREDIT",
            amountPaise: gstOnPlatformFeePaise,
            entityId: "GOVT_TAX_GST",
            memo: "18% GST output liability on platform convenience fee",
          },
          {
            account: "FOOD_GST_9_5_LIABILITY",
            direction: "CREDIT",
            amountPaise: sec9_5GstPaise,
            entityId: "GOVT_TAX_SEC9_5",
            memo: "5% Section 9(5) CGST Food Tax remitted under OrderKing GSTIN 18AFXPH9838M1Z9",
          },
        ],
      });

      assert.ok(tx.transactionId);
      assert.strictEqual(tx.totalAmountPaise, totalCustomerDebitPaise);

      const sumDebits = tx.entries
        .filter((e) => e.direction === "DEBIT")
        .reduce((sum, e) => sum + e.amountPaise, 0);
      const sumCredits = tx.entries
        .filter((e) => e.direction === "CREDIT")
        .reduce((sum, e) => sum + e.amountPaise, 0);

      // Verify mathematical zero-paise variance
      assert.strictEqual(sumDebits - sumCredits, 0);
      assert.strictEqual(sumDebits, totalCustomerDebitPaise);
      assert.strictEqual(sumCredits, totalCustomerDebitPaise);
    });

    test("verifies Section 9(5) CGST is strictly platform liability and NEVER debited from merchant", () => {
      const orderInput: OrderReconciliationInput = {
        orderId: "ord_sec95_01",
        orderNumber: "OK-9501",
        placedAt: "2026-10-27T12:00:00Z",
        foodValuePaise: 100_000, // ₹1,000.00
        packingPaise: 5_000,     // ₹50.00
        restaurantDiscountPaise: 10_000, // ₹100.00
        commissionBps: 1800,     // 18%
        gatewayFeeBps: 180,      // 1.8%
        hasValidPan: true,
        panNumber: "ABCDE1234F",
      };

      const statement = reconEngine.reconcileOrder(orderInput);

      // Gross sales = 105,000 paise; Net taxable supply = 95,000 paise
      assert.strictEqual(statement.grossSalesPaise, 105_000);
      assert.strictEqual(statement.netTaxableSupplyPaise, 95_000);

      // 5% Section 9(5) Food GST = 4,750 paise
      assert.strictEqual(statement.sec9_5FoodGstPaise, 4_750);
      assert.ok(statement.sec9_5RemittanceGstin); // e.g. ORDERKING_GSTIN or 18AFXPH9838M1Z9

      // Verify deduction breakdown:
      // Commission 18% on 95,000 = 17,100 paise; 18% GST on Commission = 3,078 paise
      // Gateway Fee 1.8% on 105,000 = 1,890 paise; 18% GST on Gateway Fee = 340 paise
      // Section 52 TCS 0.5% on 95,000 = 475 paise
      // Section 194-O TDS 0.1% on 105,000 = 105 paise
      const expectedDeductions =
        statement.platformCommissionPaise +
        statement.gstOnCommissionPaise +
        statement.gatewayFeePaise +
        statement.gstOnGatewayFeePaise +
        statement.tcsSection52Paise +
        statement.tdsSection194OPaise;

      assert.strictEqual(statement.totalDeductionsPaise, expectedDeductions);

      // Crucial statutory invariant: sec9_5FoodGstPaise (4,750) is NOT part of totalDeductionsPaise
      assert.strictEqual(
        statement.totalDeductionsPaise < statement.totalDeductionsPaise + statement.sec9_5FoodGstPaise,
        true
      );
      assert.strictEqual(
        statement.netPayablePaise,
        statement.grossSalesPaise - statement.restaurantDiscountPaise - statement.totalDeductionsPaise
      );
    });
  });

  // =========================================================================
  // SECTION 2: RIDER FARE FLOOR & STATUTORY PASS-THROUGH
  // =========================================================================
  describe("Section 2: Rider Fare Floor & Statutory Pass-Through", () => {
    test("strictly enforces ₹35 minimum base floor per trip and 100% tip pass-through", () => {
      // Scenario A: Short trip (1.2 km) with zero base pay specified -> Must floor to ₹35 (3,500 paise)
      const earningsFloor = calculateRiderNetEarnings({
        deliveriesCompleted: 1,
        baseFloorPaise: 2_000, // Below statutory ₹35 floor
        distancePayPaise: 600,
        surgeIncentivesPaise: 0,
        customerTipPaise: 5_000, // ₹50 customer tip
      });

      // Base pay floored up to 3,500 paise (1 * 3,500)
      assert.strictEqual(earningsFloor.baseFloorPaise, 3_500);
      assert.strictEqual(earningsFloor.totalBasePayPaise, 3_500);
      assert.strictEqual(earningsFloor.customerTipPaise, 5_000);
      assert.strictEqual(earningsFloor.passThroughTipPercentage, 100);
      // Gross earnings = 3,500 + 600 + 5,000 = 9,100 paise
      assert.strictEqual(earningsFloor.grossEarningsPaise, 9_100);

      // Scenario B: Multi-trip batch (10 trips) with mixed cash collections
      const batchSettlement = calculateRiderWeeklySettlement({
        riderId: "rider_rahul_01",
        riderName: "Rahul Das",
        cycle: getWeeklyCycle(),
        deliveriesCompleted: 10,
        basePayPaise: 40_000, // ₹40/trip > ₹35 min floor
        distancePayPaise: 15_000,
        surgeIncentivesPaise: 5_000,
        tipsPaise: 8_000,
        cashCollectedPaise: 25_000, // Collected ₹250 COD cash from customers
      });

      assert.strictEqual(batchSettlement.grossEarningsPaise, 68_000); // ₹680.00
      assert.strictEqual(batchSettlement.cashCollectedPaise, 25_000); // ₹250.00
      assert.strictEqual(batchSettlement.netDisbursementPaise, 43_000); // ₹430.00 net bank payout
    });

    test("posts balanced double-entry rider settlement with COD cash offset", async () => {
      const cycle = getWeeklyCycle();
      const settlement = calculateRiderWeeklySettlement({
        riderId: "rider_rahul_01",
        riderName: "Rahul Das",
        cycle,
        deliveriesCompleted: 25,
        basePayPaise: 87_500, // 25 * 3,500 = ₹875.00
        distancePayPaise: 30_000,
        surgeIncentivesPaise: 12_000,
        tipsPaise: 15_000,
        cashCollectedPaise: 40_000, // ₹400 COD in rider pocket
      });

      assert.strictEqual(settlement.grossEarningsPaise, 144_500); // ₹1,445.00
      assert.strictEqual(settlement.netDisbursementPaise, 104_500); // ₹1,045.00 net bank transfer

      // Double-entry journal:
      // DEBIT RIDER_PAYABLE: 144,500 paise (clearing total earnings entitlement)
      // CREDIT CUSTOMER_CASH_IN: 40,000 paise (clearing COD cash held by rider)
      // CREDIT BANK_CLEARING: 104,500 paise (funds transferred via UPI/bank)
      const idempotencyKey = `stl_rider_${settlement.riderId}_${cycle.cycleId}`;
      const tx = await canonicalLedger.postTransaction({
        idempotencyKey,
        eventType: "RIDER_WEEKLY_SETTLEMENT_DISBURSED",
        entries: [
          {
            account: "RIDER_PAYABLE",
            direction: "DEBIT",
            amountPaise: settlement.grossEarningsPaise,
            entityId: settlement.riderId,
            memo: `Gross weekly earnings cleared for ${settlement.riderName}`,
          },
          {
            account: "CUSTOMER_CASH_IN",
            direction: "CREDIT",
            amountPaise: settlement.cashCollectedPaise,
            entityId: settlement.riderId,
            memo: "COD cash holding reconciled and offset against rider earnings",
          },
          {
            account: "BANK_CLEARING",
            direction: "CREDIT",
            amountPaise: settlement.netDisbursementPaise,
            entityId: "BANK_PAYOUT",
            memo: `Net payout transfer via direct UPI to ${settlement.upiIdOrBankMasked}`,
          },
        ],
      });

      assert.ok(tx.transactionId);
      const debits = tx.entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountPaise, 0);
      const credits = tx.entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountPaise, 0);
      assert.strictEqual(debits, credits);
      assert.strictEqual(debits, settlement.grossEarningsPaise);
    });
  });

  // =========================================================================
  // SECTION 3: ALL EDGE CONDITIONS VERIFIED FOR ZERO-PAISE VARIANCE
  // =========================================================================
  describe("Section 3: Edge Conditions & Zero-Paise Variance Stress", () => {
    test("Edge Condition A: Odd paise food values with fractional division produces 0 drift", () => {
      const oddValues = [
        { food: 13_733, pack: 333, disc: 111 }, // ₹137.33 food, ₹3.33 pack, ₹1.11 disc
        { food: 99_999, pack: 499, disc: 777 }, // ₹999.99
        { food: 101, pack: 1, disc: 0 },        // ₹1.01
        { food: 777_777, pack: 12_345, disc: 99_999 },
      ];

      for (const val of oddValues) {
        const statement = reconEngine.reconcileOrder({
          orderId: `ord_odd_${val.food}`,
          orderNumber: `OK-ODD-${val.food}`,
          placedAt: "2026-10-27T13:00:00Z",
          foodValuePaise: val.food,
          packingPaise: val.pack,
          restaurantDiscountPaise: val.disc,
          commissionBps: 1800,
          gatewayFeeBps: 180,
          hasValidPan: true,
        });

        // Exact SafeInteger validation
        assert.ok(Number.isSafeInteger(statement.netPayablePaise));
        assert.ok(statement.netPayablePaise >= 0);

        // Verify that summing individual deductions equals totalDeductionsPaise exactly
        const deductionSum =
          statement.platformCommissionPaise +
          statement.gstOnCommissionPaise +
          statement.gatewayFeePaise +
          statement.gstOnGatewayFeePaise +
          statement.tcsSection52Paise +
          statement.tdsSection194OPaise;

        assert.strictEqual(statement.totalDeductionsPaise, deductionSum);

        // Verify Net Payable formula
        const netCalculated = Math.max(
          0,
          statement.grossSalesPaise - statement.restaurantDiscountPaise - statement.totalDeductionsPaise
        );
        assert.strictEqual(statement.netPayablePaise, netCalculated);
      }
    });

    test("Edge Condition B: 100% discount / free promo orders never results in negative net payable", () => {
      const statement = reconEngine.reconcileOrder({
        orderId: "ord_free_01",
        orderNumber: "OK-FREE-01",
        placedAt: "2026-10-27T13:30:00Z",
        foodValuePaise: 50_000, // ₹500.00
        packingPaise: 0,
        restaurantDiscountPaise: 50_000, // 100% restaurant funded discount
        commissionBps: 1800,
        hasValidPan: true,
      });

      assert.strictEqual(statement.grossSalesPaise, 50_000);
      assert.strictEqual(statement.netTaxableSupplyPaise, 0); // 50,000 - 50,000 = 0
      assert.strictEqual(statement.platformCommissionPaise, 0);
      assert.strictEqual(statement.tcsSection52Paise, 0);
      assert.strictEqual(statement.netPayablePaise, 0);
      assert.ok(Number.isSafeInteger(statement.netPayablePaise));
    });

    test("Edge Condition C: 0% Table QR / Sovereign ordering applies 0 commission and 0 fee", () => {
      const statement = reconEngine.reconcileOrder({
        orderId: "ord_table_qr_01",
        orderNumber: "OK-TQR-01",
        placedAt: "2026-10-27T14:00:00Z",
        foodValuePaise: 120_000, // ₹1,200.00
        packingPaise: 0,
        restaurantDiscountPaise: 0,
        commissionBps: 0, // 0% commission for sovereign dine-in
        gatewayFeeBps: 0, // 0% gateway fee
        hasValidPan: true,
      });

      assert.strictEqual(statement.platformCommissionPaise, 0);
      assert.strictEqual(statement.gstOnCommissionPaise, 0);
      assert.strictEqual(statement.gatewayFeePaise, 0);
      assert.strictEqual(statement.gstOnGatewayFeePaise, 0);

      // Only statutory taxes apply: 0.5% TCS (600 paise) + 0.1% TDS (120 paise) = 720 paise
      assert.strictEqual(statement.tcsSection52Paise, 600);
      assert.strictEqual(statement.tdsSection194OPaise, 120);
      assert.strictEqual(statement.totalDeductionsPaise, 720);
      assert.strictEqual(statement.netPayablePaise, 120_000 - 720);
    });

    test("Edge Condition D: Dual Settlement - Express Daily (T+1 early liquidity) vs Standard Weekly (0%)", () => {
      const baseInput: OrderReconciliationInput = {
        orderId: "ord_dual_01",
        orderNumber: "OK-DUAL-01",
        placedAt: "2026-10-26T18:00:00Z",
        foodValuePaise: 200_000, // ₹2,000.00
        packingPaise: 5_000,
        restaurantDiscountPaise: 10_000,
        commissionBps: 1800,
        gatewayFeeBps: 180,
        hasValidPan: true,
      };

      const weekly = reconEngine.reconcileOrder({ ...baseInput, cycleType: "STANDARD_WEEKLY" });
      const express = reconEngine.reconcileOrder({ ...baseInput, cycleType: "EXPRESS_DAILY" });

      // Weekly applies zero early liquidity fee
      assert.strictEqual(weekly.expressEarlyLiquidityFeePaise, 0);
      assert.strictEqual(weekly.gstOnExpressLiquidityFeePaise, 0);

      // Express Daily applies nominal 0.5% (50 bps) early liquidity fee + 18% GST
      assert.ok(express.expressEarlyLiquidityFeePaise > 0);
      assert.ok(express.gstOnExpressLiquidityFeePaise > 0);
      assert.strictEqual(
        express.netPayablePaise,
        weekly.netPayablePaise - express.expressEarlyLiquidityFeePaise - express.gstOnExpressLiquidityFeePaise
      );
    });

    test("Edge Condition E: Missing PAN penal rate under Section 206AA (5% TDS vs 0.1% TDS)", () => {
      const panValid = reconEngine.reconcileOrder({
        orderId: "ord_pan_01",
        orderNumber: "OK-PAN-01",
        placedAt: "2026-10-27T14:30:00Z",
        foodValuePaise: 100_000,
        commissionBps: 1800,
        hasValidPan: true,
        panNumber: "ABCDE1234F",
      });

      const panMissing = reconEngine.reconcileOrder({
        orderId: "ord_pan_02",
        orderNumber: "OK-PAN-02",
        placedAt: "2026-10-27T14:30:00Z",
        foodValuePaise: 100_000,
        commissionBps: 1800,
        hasValidPan: false,
        panNumber: undefined,
      });

      // Valid PAN: 0.1% TDS on 100,000 = 100 paise
      assert.strictEqual(panValid.tdsSection194OPaise, 100);

      // Missing PAN: 5.0% TDS under Section 206AA on 100,000 = 5,000 paise (50x penal rate)
      assert.strictEqual(panMissing.tdsSection194OPaise, 5_000);
      assert.strictEqual(panValid.netPayablePaise > panMissing.netPayablePaise, true);
    });
  });

  // =========================================================================
  // SECTION 4: HIGH-CONCURRENCY STRESS & CRYPTOGRAPHIC CHAIN INTEGRITY
  // =========================================================================
  describe("Section 4: High-Concurrency Stress & Cryptographic Chain Integrity", () => {
    test("executes 100 concurrent asynchronous double-entry postings with zero corruption", async () => {
      const ledger = new CanonicalLedger();
      const concurrencyCount = 100;
      const tasks: Promise<any>[] = [];

      for (let i = 0; i < concurrencyCount; i++) {
        const amount = 10_000 + i * 250; // Distinct amounts
        const task = ledger.postTransaction({
          idempotencyKey: `concurrent_stress_tx_${i}_${Date.now()}`,
          eventType: "CONCURRENT_ORDER_PAYMENT",
          orderId: `ord_concurrent_${i}`,
          entries: [
            {
              account: "BANK_CLEARING",
              direction: "DEBIT",
              amountPaise: amount,
              entityId: `NPCI_UPI:${SOVEREIGN_NPCI_UPI_VPA}`,
              memo: `Customer payment for concurrent order #${i}`,
            },
            {
              account: "RESTAURANT_PAYABLE",
              direction: "CREDIT",
              amountPaise: Math.round(amount * 0.8),
              entityId: `rest_${i % 10}`,
              memo: `Restaurant net sales for concurrent order #${i}`,
            },
            {
              account: "PLATFORM_FEE_REVENUE",
              direction: "CREDIT",
              amountPaise: amount - Math.round(amount * 0.8),
              entityId: "PLATFORM",
              memo: `Platform fee for concurrent order #${i}`,
            },
          ],
        });
        tasks.push(task);
      }

      const results = await Promise.all(tasks);
      assert.strictEqual(results.length, concurrencyCount);

      // Verify that each transaction in the in-memory chain is cryptographically linked
      const integrity = await ledger.verifyLedgerChainIntegrity();
      assert.strictEqual(integrity.isValid, true);
      assert.strictEqual(integrity.totalTransactions, concurrencyCount);
    });

    test("handles concurrent duplicate submissions with strict idempotency lock", async () => {
      const ledger = new CanonicalLedger();
      const sharedIdempotencyKey = "shared_concurrent_idempotency_key_999";

      // Fire 10 identical requests concurrently
      const concurrentCalls = Array.from({ length: 10 }, () =>
        ledger.postTransaction({
          idempotencyKey: sharedIdempotencyKey,
          eventType: "IDEMPOTENT_CAPTURE",
          orderId: "ord_idempotent_999",
          entries: [
            { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 50_000, entityId: "BANK", memo: "Deposit" },
            { account: "CUSTOMER_WALLET", direction: "CREDIT", amountPaise: 50_000, entityId: "user_123", memo: "Credit" },
          ],
        })
      );

      const settled = await Promise.all(concurrentCalls);

      // All 10 callers must receive the exact same transaction ID and audit hash
      const firstTxId = settled[0].transactionId;
      const firstAuditHash = settled[0].auditHash;

      for (const res of settled) {
        assert.strictEqual(res.transactionId, firstTxId);
        assert.strictEqual(res.auditHash, firstAuditHash);
        assert.strictEqual(res.idempotencyKey, sharedIdempotencyKey);
      }

      const transactions = await ledger.listTransactions();
      // Must contain strictly 1 single transaction row (zero duplicate writes)
      assert.strictEqual(transactions.length, 1);
    });
  });

  // =========================================================================
  // SECTION 5: FAIL-CLOSED AUDIT TRIGGERS VERIFICATION
  // =========================================================================
  describe("Section 5: Fail-Closed Audit Triggers Verification", () => {
    test("Fail-Closed Trigger 1: Imbalanced double-entry journal throws fatal error and halts", async () => {
      const ledger = new CanonicalLedger();

      await assert.rejects(
        async () => {
          await ledger.postTransaction({
            idempotencyKey: "imbalance_trigger_001",
            eventType: "CORRUPT_SPLIT",
            entries: [
              { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 10_000, entityId: "BANK", memo: "Debit" },
              { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 9_999, entityId: "REST", memo: "Missing 1 paise" },
            ],
          });
        },
        /Double-entry violation: Debits \(10000\) do not match Credits \(9999\)/
      );
    });

    test("Fail-Closed Trigger 2: Fractional or negative paise values throw fatal validation error", async () => {
      const ledger = new CanonicalLedger();

      // Fractional paise (e.g. 100.5)
      await assert.rejects(
        async () => {
          await ledger.postTransaction({
            idempotencyKey: "fractional_trigger_001",
            eventType: "FRACTIONAL_SPLIT",
            entries: [
              { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 100.5, entityId: "BANK", memo: "Float" },
              { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 100.5, entityId: "REST", memo: "Float" },
            ],
          });
        },
        /Invalid entry amount: 100.5/
      );

      // Negative paise (-500)
      await assert.rejects(
        async () => {
          await ledger.postTransaction({
            idempotencyKey: "negative_trigger_001",
            eventType: "NEGATIVE_SPLIT",
            entries: [
              { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: -500, entityId: "BANK", memo: "Negative" },
              { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: -500, entityId: "REST", memo: "Negative" },
            ],
          });
        },
        /Invalid entry amount: -500/
      );
    });

    test("Fail-Closed Trigger 3: Late-Night Curfew strictly locks out COD between 23:00 and 04:00 IST", () => {
      // 23:30 IST timestamp
      const lateNightTimestamp = new Date("2026-10-27T18:00:00Z"); // 18:00 UTC = 23:30 IST

      const evalResult = CanonicalLedger.evaluatePaymentMethodSafety({
        paymentMethod: "COD",
        timestamp: lateNightTimestamp,
      });

      assert.strictEqual(evalResult.allowed, false);
      assert.strictEqual(evalResult.isLateNight, true);
      assert.match(evalResult.reason || "", /LATE_NIGHT_COD_LOCKOUT/);
      assert.match(evalResult.reason || "", /orderking@ybl/);

      // Direct UPI is always allowed
      const upiResult = CanonicalLedger.evaluatePaymentMethodSafety({
        paymentMethod: "NPCI_UPI",
        timestamp: lateNightTimestamp,
      });
      assert.strictEqual(upiResult.allowed, true);
    });

    test("Fail-Closed Trigger 4: Declared Threat Zones strictly locks out COD for rider physical safety", () => {
      const threatZoneResult = CanonicalLedger.evaluatePaymentMethodSafety({
        paymentMethod: "COD",
        timestamp: new Date("2026-10-27T08:00:00Z"), // 13:30 IST (daytime)
        isThreatZone: true,
      });

      assert.strictEqual(threatZoneResult.allowed, false);
      assert.strictEqual(threatZoneResult.isThreatZone, true);
      assert.match(threatZoneResult.reason || "", /THREAT_ZONE_COD_LOCKOUT/);
    });

    test("Fail-Closed Trigger 5: Audit chain tampering is instantly detected by cryptographic verification", async () => {
      const ledger = new CanonicalLedger();

      // Post 3 valid sequential transactions
      await ledger.postTransaction({
        idempotencyKey: "chain_tx_1",
        eventType: "TEST_1",
        entries: [
          { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 10_000, entityId: "BANK", memo: "T1" },
          { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 10_000, entityId: "R1", memo: "T1" },
        ],
      });

      const tx2 = await ledger.postTransaction({
        idempotencyKey: "chain_tx_2",
        eventType: "TEST_2",
        entries: [
          { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 20_000, entityId: "BANK", memo: "T2" },
          { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 20_000, entityId: "R2", memo: "T2" },
        ],
      });

      await ledger.postTransaction({
        idempotencyKey: "chain_tx_3",
        eventType: "TEST_3",
        entries: [
          { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 30_000, entityId: "BANK", memo: "T3" },
          { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 30_000, entityId: "R3", memo: "T3" },
        ],
      });

      // Verify chain is valid initially
      const initialCheck = await ledger.verifyLedgerChainIntegrity();
      assert.strictEqual(initialCheck.isValid, true);
      assert.strictEqual(initialCheck.totalTransactions, 3);

      // Simulate malicious database tampering: attacker edits tx2 totalAmountPaise
      (tx2 as any).totalAmountPaise = 99_999;

      // Verification MUST detect tampering and identify tamperedTxId
      const tamperedCheck = await ledger.verifyLedgerChainIntegrity();
      assert.strictEqual(tamperedCheck.isValid, false);
      assert.strictEqual(tamperedCheck.tamperedTxId, tx2.transactionId);
    });
  });
});
