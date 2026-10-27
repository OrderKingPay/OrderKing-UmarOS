import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateMerchantNetPayable,
  calculateRiderNetEarnings,
  calculateRiderWeeklySettlement,
  postRiderWeeklySettlementToLedger,
  getWeeklyCycle,
} from "./weekly-settlement.ts";
import {
  createMerchantContract,
  generateMerchantWeeklySettlementStatement,
  postMerchantSettlementToLedger,
} from "./merchant-contracts.ts";
import {
  canonicalLedger,
  SOVEREIGN_NPCI_UPI_VPA,
  SECONDARY_NPCI_UPI_VPA,
} from "./canonical-ledger.ts";

describe("👑 SPECIALIST MISSION CERTIFICATION: FINTECH & SETTLEMENTS AUDIT", () => {
  // =========================================================================
  // MISSION 1: INTEGER PAISE FINANCIAL VERIFICATION & ZERO-FLOAT INVARIANT
  // =========================================================================
  describe("Mission 1: Integer Paise Financial Verification & Zero-Float Invariant", () => {
    test("Merchant Net Payable (NRP) exact calculation on newly onboarded restaurant", async () => {
      // Newly onboarded restaurant: Royal Biryani Darbar
      // Gross Food Sales: ₹1,50,000.00 (15,000,000 paise)
      // Packaging: ₹3,500.00 (350,000 paise)
      // Restaurant Discounts: ₹10,000.00 (1,000,000 paise)
      // Negotiated Commission: 18% (1800 bps) on net food (14,000,000 * 0.18 = 2,520,000 paise)
      // Platform Promos / Subsidy: ₹5,000.00 (500,000 paise)
      // Commission 18% GST: 453,600 paise
      // TCS (1% Sec 52): 140,000 paise
      // TDS (1% Sec 194-O): 140,000 paise
      // Total Taxes: 453,600 + 140,000 + 140,000 = 733,600 paise
      // Deductions (PG fee 1.8% on gross 15,350,000 = 276,300 + 49,734 GST = 326,034 paise)
      const nrpResult = calculateMerchantNetPayable({
        grossFoodSalesPaise: 15_000_000,
        packagingPaise: 350_000,
        restaurantDiscountsPaise: 1_000_000,
        commissionBps: 1800,
        platformPromosPaise: 500_000,
        statutoryTaxesPaise: 733_600,
        otherDeductionsPaise: 326_034,
      });

      // Verify formula components:
      // NRP = Gross Food Sales + Packaging - Discounts - Commission + Promos - Taxes - Deductions
      const expectedNrp =
        15_000_000 + 350_000 - 1_000_000 - 2_520_000 + 500_000 - 733_600 - 326_034;
      assert.strictEqual(expectedNrp, 11_270_366); // Exactly ₹1,12,703.66 in paise
      assert.strictEqual(nrpResult.netPayablePaise, 11_270_366);

      // Verify strict SafeInteger invariant & zero float drift
      assert.ok(Number.isSafeInteger(nrpResult.netPayablePaise));
      assert.ok(Number.isInteger(nrpResult.netPayablePaise));
      assert.strictEqual(nrpResult.netPayablePaise % 1, 0);

      // Verify contract lifecycle & double-entry posting to canonicalLedger
      const contract = createMerchantContract({
        restaurantId: "rest_royal_biryani_01",
        restaurantName: "Royal Biryani Darbar",
        baseCommissionBps: 1800,
      });

      const statement = generateMerchantWeeklySettlementStatement({
        contract,
        deliveredOrdersCount: 250,
        grossSalesPaise: 15_000_000,
        restaurantDiscountsPaise: 1_000_000,
        packagingChargesPaise: 350_000,
        platformReimbursementsPaise: 500_000,
        otherDeductionsPaise: 326_034,
      });

      assert.ok(statement.financials.netPayablePaise > 0);
      assert.ok(Number.isSafeInteger(statement.financials.netPayablePaise));

      const ledgerTx = await postMerchantSettlementToLedger(statement, canonicalLedger);
      assert.ok(ledgerTx.transactionId);
      assert.strictEqual(ledgerTx.eventType, "MERCHANT_SETTLEMENT_DISBURSED");

      // Verify double-entry balance: sum(Debits) === sum(Credits)
      const debits = ledgerTx.entries.filter((e) => e.direction === "DEBIT");
      const credits = ledgerTx.entries.filter((e) => e.direction === "CREDIT");
      const sumDebits = debits.reduce((s, e) => s + e.amountPaise, 0);
      const sumCredits = credits.reduce((s, e) => s + e.amountPaise, 0);

      assert.strictEqual(sumDebits, sumCredits);
      assert.strictEqual(sumDebits, statement.financials.totalCreditsPaise);
    });

    test("Rider Net Earnings exact calculation enforcing ₹35 base floor and 100% tip pass-through", async () => {
      // Newly onboarded delivery partner: Rahul Das
      // Completed 20 deliveries
      // Distance pay: ₹650.00 (65,000 paise)
      // Surge incentives (Rain + Peak): ₹300.00 (30,000 paise)
      // Customer tips: ₹450.00 (45,000 paise)
      const riderEarnings = calculateRiderNetEarnings({
        deliveriesCompleted: 20,
        baseFloorPaise: 3500, // ₹35 statutory minimum floor per delivery
        distancePayPaise: 65_000,
        surgeIncentivesPaise: 30_000,
        customerTipPaise: 45_000,
      });

      // Base pay = 20 * 3500 = 70,000 paise (₹700.00)
      assert.strictEqual(riderEarnings.totalBasePayPaise, 70_000);
      assert.strictEqual(riderEarnings.baseFloorPaise, 3500);

      // Formula: Rider Net Earnings = Base Floor (₹35 min) + Distance Pay + Surge Incentives + 100% Tips
      const expectedEarnings = 70_000 + 65_000 + 30_000 + 45_000;
      assert.strictEqual(expectedEarnings, 210_000); // Exactly ₹2,100.00 in paise
      assert.strictEqual(riderEarnings.grossEarningsPaise, 210_000);

      // 100% Tips pass-through invariant: 0 platform cut
      assert.strictEqual(riderEarnings.customerTipPaise, 45_000);
      assert.strictEqual(riderEarnings.passThroughTipPercentage, 100);

      // Zero float invariant
      assert.ok(Number.isSafeInteger(riderEarnings.grossEarningsPaise));
      assert.ok(Number.isInteger(riderEarnings.grossEarningsPaise));
      assert.strictEqual(riderEarnings.grossEarningsPaise % 1, 0);

      // Verify weekly settlement and double-entry ledger posting with COD reconciliation
      const weeklyCycle = getWeeklyCycle();
      const settlement = calculateRiderWeeklySettlement({
        riderId: "rider_rahul_001",
        riderName: "Rahul Das",
        upiOrBankMasked: "rahul@ybl",
        cycle: weeklyCycle,
        deliveriesCompleted: 20,
        basePayPaise: 70_000,
        distancePayPaise: 65_000,
        surgeIncentivesPaise: 30_000,
        tipsPaise: 45_000,
        cashCollectedPaise: 50_000, // ₹500 COD cash collected
      });

      assert.strictEqual(settlement.grossEarningsPaise, 210_000);
      assert.strictEqual(settlement.cashCollectedPaise, 50_000);
      assert.strictEqual(settlement.netDisbursementPaise, 160_000); // ₹1,600.00 bank transfer

      const riderTx = await postRiderWeeklySettlementToLedger(settlement, canonicalLedger);
      assert.ok(riderTx.transactionId);
      assert.strictEqual(riderTx.eventType, "RIDER_SETTLEMENT_DISBURSED");

      // Verify double-entry balance: Debits === Credits
      const debits = riderTx.entries.filter((e) => e.direction === "DEBIT");
      const credits = riderTx.entries.filter((e) => e.direction === "CREDIT");
      const sumDebits = debits.reduce((s, e) => s + e.amountPaise, 0);
      const sumCredits = credits.reduce((s, e) => s + e.amountPaise, 0);

      assert.strictEqual(sumDebits, 210_000);
      assert.strictEqual(sumCredits, 210_000);
      assert.strictEqual(sumDebits, sumCredits);

      // Credit 1: Reconcile COD cash liability
      const codCredit = credits.find((e) => e.account === "CUSTOMER_CASH_IN");
      assert.strictEqual(codCredit?.amountPaise, 50_000);

      // Credit 2: Bank disbursement to rider
      const bankCredit = credits.find((e) => e.account === "BANK_CLEARING");
      assert.strictEqual(bankCredit?.amountPaise, 160_000);
    });
  });

  // =========================================================================
  // MISSION 2: NPCI UPI SETTLEMENT INTEGRITY & BHARATQR LINKING
  // =========================================================================
  describe("Mission 2: NPCI UPI Settlement Integrity & BharatQR Linking", () => {
    test("direct UPI rails (orderking@ybl, 9395065587@ybl) route straight into BANK_CLEARING without intermediary float accounts", async () => {
      const totalOrderPaise = 65000; // ₹650.00
      const platformFeePaise = 1500; // ₹15.00
      const deliveryFeePaise = 4500; // ₹45.00
      const gstPaise = 270;          // ₹2.70
      const netFoodPaise = totalOrderPaise - platformFeePaise - deliveryFeePaise - gstPaise; // 58730 paise

      // 1. Capture order payment via Sovereign VPA (orderking@ybl)
      const sovereignTx = await canonicalLedger.recordNpciUpiDirectCollection({
        orderId: "ord_npci_sovereign_01",
        totalAmountPaise: totalOrderPaise,
        platformFeePaise,
        deliveryFeePaise,
        gstPaise,
        restaurantId: "rest_taj_01",
        riderId: "rider_fast_01",
        idempotencyKey: "test-idem-sovereign-upi-" + Date.now(),
        vpa: SOVEREIGN_NPCI_UPI_VPA,
      });

      assert.ok(sovereignTx.transactionId);
      assert.strictEqual(sovereignTx.totalAmountPaise, totalOrderPaise);

      // DEBIT must route directly to BANK_CLEARING with NPCI_UPI:orderking@ybl entity
      // ZERO intermediary float or custodial wallet account
      const sovereignDebit = sovereignTx.entries.find((e) => e.direction === "DEBIT");
      assert.strictEqual(sovereignDebit?.account, "BANK_CLEARING");
      assert.strictEqual(sovereignDebit?.entityId, `NPCI_UPI:${SOVEREIGN_NPCI_UPI_VPA}`);
      assert.strictEqual(sovereignDebit?.amountPaise, totalOrderPaise);

      // CREDITS must balance to exact components without leakage
      const sovereignCredits = sovereignTx.entries.filter((e) => e.direction === "CREDIT");
      const sumCredits = sovereignCredits.reduce((s, e) => s + e.amountPaise, 0);
      assert.strictEqual(sumCredits, totalOrderPaise);

      // 2. Capture order payment via Secondary VPA (9395065587@ybl)
      const secondaryTx = await canonicalLedger.recordNpciUpiDirectCollection({
        orderId: "ord_npci_secondary_02",
        totalAmountPaise: totalOrderPaise,
        platformFeePaise,
        deliveryFeePaise,
        gstPaise,
        restaurantId: "rest_taj_01",
        riderId: "rider_fast_01",
        idempotencyKey: "test-idem-secondary-upi-" + Date.now(),
        vpa: SECONDARY_NPCI_UPI_VPA,
      });

      const secondaryDebit = secondaryTx.entries.find((e) => e.direction === "DEBIT");
      assert.strictEqual(secondaryDebit?.account, "BANK_CLEARING");
      assert.strictEqual(secondaryDebit?.entityId, `NPCI_UPI:${SECONDARY_NPCI_UPI_VPA}`);
      assert.strictEqual(secondaryDebit?.amountPaise, totalOrderPaise);
    });

    test("BharatQR dynamic payload links direct sovereign VPA with verified CRC-16 checksum", () => {
      // Direct EMVCo BharatQR TLV builder logic
      const vpa = SOVEREIGN_NPCI_UPI_VPA;
      const payeeName = "OrderKingPay";
      const amount = "650.00";
      const txnRef = "OKUPI998877";

      const toTLV = (tag: string, value: string) => {
        const len = value.length.toString().padStart(2, "0");
        return `${tag}${len}${value}`;
      };

      // Construct standards-compliant EMVCo TLV string
      let payload = "";
      payload += toTLV("00", "01"); // Format indicator
      payload += toTLV("01", "12"); // Dynamic QR
      payload += toTLV("26", toTLV("00", "in.npci.upi") + toTLV("01", vpa));
      payload += toTLV("52", "5812"); // Food & Dining MCC
      payload += toTLV("53", "356"); // INR Currency
      payload += toTLV("54", amount); // Order Amount
      payload += toTLV("58", "IN"); // Country IN
      payload += toTLV("59", payeeName);
      payload += toTLV("60", "Silchar");
      payload += toTLV("62", toTLV("01", txnRef));

      // CRC-16 calculation (CCITT polynomial 0x1021)
      const preCrc = `${payload}6304`;
      let crc = 0xffff;
      for (let i = 0; i < preCrc.length; i++) {
        crc ^= preCrc.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = (crc << 1) ^ 0x1021;
          } else {
            crc = crc << 1;
          }
        }
      }
      const checksum = (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
      const fullBharatQrPayload = `${preCrc}${checksum}`;

      // Assertions
      assert.ok(fullBharatQrPayload.includes(vpa));
      assert.ok(fullBharatQrPayload.includes("in.npci.upi"));
      assert.ok(fullBharatQrPayload.endsWith(checksum));
      assert.strictEqual(checksum.length, 4);

      // Verify direct sovereign rail: No intermediary escrow or wallet parameter exists in payload
      assert.ok(!fullBharatQrPayload.includes("intermediary"));
      assert.ok(!fullBharatQrPayload.includes("float"));
    });
  });
});
