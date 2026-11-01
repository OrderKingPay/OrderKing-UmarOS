import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  CanonicalLedger,
  canonicalLedger,
  MANDATORY_OTA_CONVENIENCE_FEE_PAISE,
  type OtaTravelBookingParams,
  SOVEREIGN_NPCI_UPI_VPA,
} from "./canonical-ledger.ts";

describe("👑 HIGH-YIELD OTA CONVENIENCE FEE & DOUBLE-ENTRY LEDGER LOCKDOWN", () => {
  // =========================================================================
  // MISSION 1: MANDATORY PLATFORM CONVENIENCE FEES ENFORCEMENT
  // =========================================================================
  describe("Mission 1: Mandatory Platform Convenience Fees Enforcement", () => {
    test("enforces mandatory ₹399/passenger flight convenience fee in double-entry ledger", async () => {
      const ledger = new CanonicalLedger();
      const passengerCount = 3;
      const wholesaleNetPaise = 420_000;   // ₹4,200.00 net TBO/airline cost per passenger
      const publishedMrpPaise = 480_000;   // ₹4,800.00 airline published MRP per passenger

      const booking: OtaTravelBookingParams = {
        bookingId: "FL-DEL-BLR-001",
        serviceType: "FLIGHT",
        passengerCount,
        wholesaleNetPaise,
        publishedMrpPaise,
        idempotencyKey: `fl_booking_zero_promo_${Date.now()}`,
      };

      const result = await ledger.recordOtaTravelBooking(booking);

      // Verify mandatory ₹399 (39,900 paise) per passenger
      const expectedConvenienceFee = 39_900 * passengerCount; // ₹1,197.00 = 119,700 paise
      assert.strictEqual(result.fareBreakdown.mandatoryConvenienceFeePaise, expectedConvenienceFee);
      assert.strictEqual(result.fareBreakdown.mandatoryConvenienceFeePaise, 119_700);

      // Wholesale net total: 3 * 420,000 = 1,260,000 paise (₹12,600.00)
      assert.strictEqual(result.fareBreakdown.wholesaleNetTotalPaise, 1_260_000);

      // Published MRP total: 3 * 480,000 = 1,440,000 paise (₹14,400.00)
      assert.strictEqual(result.fareBreakdown.publishedMrpTotalPaise, 1_440_000);

      // Wholesale commission: 1,440,000 - 1,260,000 = 180,000 paise (₹1,800.00)
      assert.strictEqual(result.fareBreakdown.wholesaleCommissionPaise, 180_000);

      // Total customer debit = Published MRP (1,440,000) + Convenience Fee (119,700) = 1,559,700 paise (₹15,597.00)
      assert.strictEqual(result.fareBreakdown.totalCustomerDebitPaise, 1_559_700);

      // Verify double-entry ledger balance: sum(Debits) === sum(Credits)
      const tx = result.transaction;
      const debits = tx.entries.filter((e) => e.direction === "DEBIT");
      const credits = tx.entries.filter((e) => e.direction === "CREDIT");

      const sumDebits = debits.reduce((s, e) => s + e.amountPaise, 0);
      const sumCredits = credits.reduce((s, e) => s + e.amountPaise, 0);

      assert.strictEqual(sumDebits, sumCredits);
      assert.strictEqual(sumDebits, 1_559_700);
      assert.strictEqual(sumCredits, 1_559_700);

      // Verify specific ledger accounts
      const bankDebit = debits.find((e) => e.account === "BANK_CLEARING");
      assert.ok(bankDebit);
      assert.strictEqual(bankDebit.amountPaise, 1_559_700);

      const carrierCredit = credits.find((e) => e.account === "TRAVEL_PROVIDER_PAYABLE");
      assert.ok(carrierCredit);
      assert.strictEqual(carrierCredit.amountPaise, 1_260_000);

      const feeCredit = credits.find((e) => e.account === "PLATFORM_FEE_REVENUE");
      assert.ok(feeCredit);
      assert.strictEqual(feeCredit.amountPaise, 119_700);

      const marginCredit = credits.find((e) => e.account === "COMMISSION_ESCROW");
      assert.ok(marginCredit);
      assert.strictEqual(marginCredit.amountPaise, 180_000);
    });

    test("enforces mandatory ₹40/ticket train convenience fee in double-entry ledger", async () => {
      const ledger = new CanonicalLedger();
      const passengerCount = 4;
      const wholesaleNetPaise = 125_000; // ₹1,250.00 IRCTC fare per ticket

      const booking: OtaTravelBookingParams = {
        bookingId: "TR-IRCTC-9821",
        serviceType: "TRAIN",
        passengerCount,
        wholesaleNetPaise,
        publishedMrpPaise: wholesaleNetPaise, // 0 markup on regulated rail base fare
        idempotencyKey: `tr_booking_${Date.now()}`,
      };

      const result = await ledger.recordOtaTravelBooking(booking);

      // Mandatory ₹40 (4,000 paise) per ticket/passenger: 4 * 4,000 = 16,000 paise (₹160.00)
      assert.strictEqual(result.fareBreakdown.mandatoryConvenienceFeePaise, 16_000);
      assert.strictEqual(result.fareBreakdown.wholesaleNetTotalPaise, 500_000);
      assert.strictEqual(result.fareBreakdown.totalCustomerDebitPaise, 516_000);

      // Double-entry validation
      const debits = result.transaction.entries.filter((e) => e.direction === "DEBIT");
      const credits = result.transaction.entries.filter((e) => e.direction === "CREDIT");
      const sumDebits = debits.reduce((s, e) => s + e.amountPaise, 0);
      const sumCredits = credits.reduce((s, e) => s + e.amountPaise, 0);

      assert.strictEqual(sumDebits, sumCredits);
      assert.strictEqual(sumDebits, 516_000);
    });

    test("enforces mandatory ₹250/room hotel convenience fee in double-entry ledger", async () => {
      const ledger = new CanonicalLedger();
      const roomCount = 2;
      const wholesaleNetPaise = 280_000; // ₹2,800.00 B2B hotel net per room
      const publishedMrpPaise = 340_000; // ₹3,400.00 published room tariff

      const booking: OtaTravelBookingParams = {
        bookingId: "HT-DARBAR-401",
        serviceType: "HOTEL",
        passengerCount: roomCount,
        wholesaleNetPaise,
        publishedMrpPaise,
        idempotencyKey: `ht_booking_${Date.now()}`,
      };

      const result = await ledger.recordOtaTravelBooking(booking);

      // Mandatory ₹250 (25,000 paise) per room: 2 * 25,000 = 50,000 paise (₹500.00)
      assert.strictEqual(result.fareBreakdown.mandatoryConvenienceFeePaise, 50_000);
      assert.strictEqual(result.fareBreakdown.wholesaleNetTotalPaise, 560_000); // 2 * 280,000
      assert.strictEqual(result.fareBreakdown.publishedMrpTotalPaise, 680_000); // 2 * 340,000
      assert.strictEqual(result.fareBreakdown.wholesaleCommissionPaise, 120_000); // 680,000 - 560,000
      assert.strictEqual(result.fareBreakdown.totalCustomerDebitPaise, 730_000); // 680,000 + 50,000

      // Double-entry validation
      const debits = result.transaction.entries.filter((e) => e.direction === "DEBIT");
      const credits = result.transaction.entries.filter((e) => e.direction === "CREDIT");
      const sumDebits = debits.reduce((s, e) => s + e.amountPaise, 0);
      const sumCredits = credits.reduce((s, e) => s + e.amountPaise, 0);

      assert.strictEqual(sumDebits, sumCredits);
      assert.strictEqual(sumDebits, 730_000);
    });
  });

  // =========================================================================
  // MISSION 2: STRICTLY OPT-IN PROMO CODES & 100% RETAINED MARGINS
  // =========================================================================
  describe("Mission 2: Strictly Opt-In Promo Codes & 100% Retained Margins", () => {
    test("when no promo code is applied, platform retains 100% of convenience fees and wholesale margins", async () => {
      const ledger = new CanonicalLedger();
      const booking: OtaTravelBookingParams = {
        bookingId: "FL-NO-PROMO-77",
        serviceType: "FLIGHT",
        passengerCount: 2,
        wholesaleNetPaise: 500_000,
        publishedMrpPaise: 550_000,
        promoCode: undefined, // No code provided
        idempotencyKey: `fl_nopromo_${Date.now()}`,
      };

      const result = await ledger.recordOtaTravelBooking(booking);

      assert.strictEqual(result.fareBreakdown.promoCodeApplied, null);
      assert.strictEqual(result.fareBreakdown.promoCashbackFoodWalletPaise, 0);
      assert.strictEqual(result.fareBreakdown.promoDiscountPaise, 0);

      // Convenience fee: 2 * 39,900 = 79,800 paise (₹798.00)
      // Wholesale commission: 2 * 50,000 = 100,000 paise (₹1,000.00)
      // 100% retained platform margin = 79,800 + 100,000 = 179,800 paise (₹1,798.00)
      assert.strictEqual(result.fareBreakdown.platformRetainedMarginPaise, 179_800);
      assert.strictEqual(result.fareBreakdown.guaranteedUpfrontCashFloatPaise, 179_800);
    });

    test("when invalid/unrecognized promo code is passed, it is strictly ignored and 100% fees retained", async () => {
      const ledger = new CanonicalLedger();
      const booking: OtaTravelBookingParams = {
        bookingId: "FL-INVALID-PROMO",
        serviceType: "FLIGHT",
        passengerCount: 1,
        wholesaleNetPaise: 400_000,
        publishedMrpPaise: 400_000,
        promoCode: "RANDOM_INVALID_CODE_99", // Unregistered promo
        idempotencyKey: `fl_invalidpromo_${Date.now()}`,
      };

      const result = await ledger.recordOtaTravelBooking(booking);

      assert.strictEqual(result.fareBreakdown.promoCodeApplied, null);
      assert.strictEqual(result.fareBreakdown.promoCashbackFoodWalletPaise, 0);
      assert.strictEqual(result.fareBreakdown.mandatoryConvenienceFeePaise, 39_900);
      assert.strictEqual(result.fareBreakdown.platformRetainedMarginPaise, 39_900);
    });

    test("when valid promo code FLYKING is explicitly opted-in, credits food wallet while preserving minimum ₹249 cash fee float", async () => {
      const ledger = new CanonicalLedger();
      const booking: OtaTravelBookingParams = {
        bookingId: "FL-OPTIN-FLYKING",
        serviceType: "FLIGHT",
        passengerCount: 1,
        wholesaleNetPaise: 450_000,
        publishedMrpPaise: 500_000,
        promoCode: "FLYKING", // Valid opt-in code
        userId: "user_sovereign_01",
        idempotencyKey: `fl_optin_${Date.now()}`,
      };

      const result = await ledger.recordOtaTravelBooking(booking);

      assert.strictEqual(result.fareBreakdown.promoCodeApplied, "FLYKING");

      // Mandatory fee is ₹399 (39,900 paise)
      // 40% of 39,900 = 15,960 -> capped at 15,000 paise (₹150.00 food wallet cashback)
      assert.strictEqual(result.fareBreakdown.promoCashbackFoodWalletPaise, 15_000);

      // Customer upfront cash collected: Published MRP (500,000) + Convenience fee (39,900) = 539,900 paise (₹5,399.00)
      assert.strictEqual(result.fareBreakdown.totalCustomerDebitPaise, 539_900);

      // Net retained cash float: ₹399 fee + ₹500 wholesale margin - ₹150 food cashback = ₹749 (74,900 paise)
      assert.strictEqual(result.fareBreakdown.platformRetainedMarginPaise, 39_900 + 50_000 - 15_000);

      // The upfront cash float collected at gateway is 100% preserved (₹899 = 89,900 paise)
      assert.strictEqual(result.fareBreakdown.guaranteedUpfrontCashFloatPaise, 89_900);

      // Net convenience fee after promo burn: 39,900 - 15,000 = 24,900 paise (Exactly ₹249.00 minimum preserved!)
      assert.strictEqual(39_900 - result.fareBreakdown.promoCashbackFoodWalletPaise, 24_900);

      // Verify that the user's KingPay wallet received the 15,000 paise credit
      const walletBalance = await ledger.getKingPayWalletBalancePaise("user_sovereign_01");
      assert.strictEqual(walletBalance, 15_000);
    });
  });

  // =========================================================================
  // MISSION 3: 100 CONCURRENT HIGH-CONCURRENCY TRANSACTIONS WITH ZERO VARIANCE
  // =========================================================================
  describe("Mission 3: 100 Concurrent High-Concurrency Transactions with Zero Variance", () => {
    test("executes 100 concurrent high-yield OTA bookings across flights, trains, and hotels with zero float discrepancies", async () => {
      const ledger = new CanonicalLedger();
      const concurrencyCount = 100;
      const tasks: Promise<any>[] = [];

      for (let i = 0; i < concurrencyCount; i++) {
        const mode = i % 3 === 0 ? "FLIGHT" : i % 3 === 1 ? "TRAIN" : "HOTEL";
        const pax = 1 + (i % 4); // 1 to 4 passengers/rooms
        const baseCost = 100_000 + i * 500; // Distinct costs
        const markup = i % 2 === 0 ? 25_000 : 0; // Alternating wholesale markup

        const task = ledger.recordOtaTravelBooking({
          bookingId: `CONC-OTA-${mode}-${i}`,
          serviceType: mode,
          passengerCount: pax,
          wholesaleNetPaise: baseCost,
          publishedMrpPaise: baseCost + markup,
          promoCode: i % 5 === 0 ? "FLYKING" : null, // 20% opt-in promo code
          userId: `user_concurrent_${i}`,
          idempotencyKey: `conc_ota_tx_${i}_${Date.now()}`,
        });
        tasks.push(task);
      }

      const results = await Promise.all(tasks);
      assert.strictEqual(results.length, concurrencyCount);

      // Verify every single transaction has EXACT mathematical zero variance: sum(Debits) === sum(Credits)
      for (const res of results) {
        const debits = res.transaction.entries.filter((e: any) => e.direction === "DEBIT");
        const credits = res.transaction.entries.filter((e: any) => e.direction === "CREDIT");

        const sumDebits = debits.reduce((s: number, e: any) => s + e.amountPaise, 0);
        const sumCredits = credits.reduce((s: number, e: any) => s + e.amountPaise, 0);

        assert.strictEqual(sumDebits, sumCredits);
        assert.strictEqual(sumDebits - sumCredits, 0);
        assert.ok(Number.isSafeInteger(sumDebits));
        assert.strictEqual(sumDebits % 1, 0); // Strictly integer paise
      }

      // Verify the entire cryptographic audit chain from transaction 0 to transaction 100+
      const chainCheck = await ledger.verifyLedgerChainIntegrity();
      assert.strictEqual(chainCheck.isValid, true);
      assert.ok(chainCheck.totalTransactions >= concurrencyCount);
    });
  });
});
