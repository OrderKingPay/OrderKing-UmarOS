import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalLedger,
  CanonicalLedger,
  SOVEREIGN_NPCI_UPI_VPA,
  isLateNightCurfewIst,
} from "./canonical-ledger.ts";

describe("Canonical Double-Entry Financial Ledger Engine", () => {
  test("initializes correctly and can list transactions asynchronously", async () => {
    try {
      const transactions = await canonicalLedger.listTransactions();
      assert.ok(Array.isArray(transactions));
    } catch (e: any) {
      if (e.message.includes("DATABASE_URL is missing") || e.message.includes("connect ECONNREFUSED")) return;
      throw e;
    }
  });

  test("can get settlement batches asynchronously", async () => {
    try {
      const batches = await canonicalLedger.listSettlementBatches();
      assert.ok(Array.isArray(batches));
    } catch (e: any) {
      if (e.message.includes("DATABASE_URL is missing") || e.message.includes("connect ECONNREFUSED")) return;
      throw e;
    }
  });

  // =========================================================================
  // FINTECH & SETTLEMENTS AUDIT: LATE-NIGHT COD LOCKOUT & DOUBLE-ENTRY PAISE
  // =========================================================================

  test("evaluates late-night curfew accurately based on Indian Standard Time (IST)", () => {
    // 23:30 IST (11:30 PM) -> Curfew Active
    const lateNightDate = new Date("2026-10-27T18:00:00.000Z"); // 18:00 UTC = 23:30 IST
    assert.strictEqual(isLateNightCurfewIst(lateNightDate), true);

    // 02:15 IST (2:15 AM) -> Curfew Active
    const earlyMorningDate = new Date("2026-10-26T20:45:00.000Z"); // 20:45 UTC = 02:15 IST
    assert.strictEqual(isLateNightCurfewIst(earlyMorningDate), true);

    // 14:00 IST (2:00 PM) -> Daytime Safe
    const daytimeDate = new Date("2026-10-27T08:30:00.000Z"); // 08:30 UTC = 14:00 IST
    assert.strictEqual(isLateNightCurfewIst(daytimeDate), false);
  });

  test("strictly enforces late-night COD lockout: rejects COD between 23:00 and 04:00 IST", async () => {
    // Attempting COD order during late night (23:30 IST)
    const lateNightDate = new Date("2026-10-27T18:00:00.000Z"); // 23:30 IST

    await assert.rejects(
      async () => {
        await canonicalLedger.captureOrderPayment({
          orderId: "ord-test-cod-latenight",
          paymentMethod: "COD",
          totalAmountPaise: 48500, // ₹485.00
          platformFeePaise: 1000,  // ₹10.00
          deliveryFeePaise: 3500,  // ₹35.00
          gstPaise: 180,           // ₹1.80
          restaurantId: "rest-001",
          idempotencyKey: "test-idem-cod-latenight",
          timestamp: lateNightDate,
        });
      },
      /LATE_NIGHT_COD_LOCKOUT: Cash on Delivery is strictly locked out between 23:00 and 04:00 IST/
    );
  });

  test("strictly rejects COD orders in declared threat zones for rider safety", async () => {
    // Daytime, but flagged as threat zone
    const daytimeDate = new Date("2026-10-27T08:30:00.000Z"); // 14:00 IST

    await assert.rejects(
      async () => {
        await canonicalLedger.captureOrderPayment({
          orderId: "ord-test-cod-threatzone",
          paymentMethod: "COD",
          totalAmountPaise: 35000,
          platformFeePaise: 1000,
          deliveryFeePaise: 3000,
          gstPaise: 180,
          restaurantId: "rest-002",
          idempotencyKey: "test-idem-cod-threat",
          timestamp: daytimeDate,
          isThreatZone: true,
        });
      },
      /THREAT_ZONE_COD_LOCKOUT: Cash on Delivery is locked out in high-risk zones/
    );
  });

  test("permits verified NPCI UPI (orderking@ybl) during late-night hours with double-entry balance", async () => {
    const lateNightDate = new Date("2026-10-27T18:00:00.000Z"); // 23:30 IST

    const tx = await canonicalLedger.captureOrderPayment({
      orderId: "ord-test-upi-latenight",
      paymentMethod: "DIRECT_UPI",
      totalAmountPaise: 55000, // ₹550.00
      platformFeePaise: 1000,  // ₹10.00
      deliveryFeePaise: 4000,  // ₹40.00
      gstPaise: 180,           // ₹1.80
      restaurantId: "rest-biryani-01",
      riderId: "rider-night-01",
      idempotencyKey: "test-idem-upi-latenight-" + Date.now(),
      timestamp: lateNightDate,
    });

    assert.ok(tx);
    assert.strictEqual(tx.eventType, "ORDER_PAYMENT_CAPTURED");
    assert.strictEqual(tx.totalAmountPaise, 55000);

    // Verify double-entry balancing: Debits must equal Credits
    const debits = tx.entries.filter((e) => e.direction === "DEBIT");
    const credits = tx.entries.filter((e) => e.direction === "CREDIT");

    const totalDebit = debits.reduce((sum, e) => sum + e.amountPaise, 0);
    const totalCredit = credits.reduce((sum, e) => sum + e.amountPaise, 0);

    assert.strictEqual(totalDebit, 55000);
    assert.strictEqual(totalCredit, 55000);
    assert.strictEqual(totalDebit, totalCredit);

    // Verify sovereign VPA entity routing
    assert.strictEqual(debits[0].account, "BANK_CLEARING");
    assert.strictEqual(debits[0].entityId, `NPCI_UPI:${SOVEREIGN_NPCI_UPI_VPA}`);
  });

  test("permits KingPay Royal Wallet during late-night hours with double-entry balance", async () => {
    const lateNightDate = new Date("2026-10-26T20:45:00.000Z"); // 02:15 IST

    const tx = await canonicalLedger.captureOrderPayment({
      orderId: "ord-test-kingpay-latenight",
      paymentMethod: "KING_PAY",
      customerId: "usr_sovereign_king",
      totalAmountPaise: 75000, // ₹750.00
      platformFeePaise: 1500,  // ₹15.00
      deliveryFeePaise: 5000,  // ₹50.00
      gstPaise: 270,           // ₹2.70
      restaurantId: "rest-curry-01",
      riderId: "rider-night-02",
      idempotencyKey: "test-idem-kingpay-latenight-" + Date.now(),
      timestamp: lateNightDate,
    });

    assert.ok(tx);
    const debits = tx.entries.filter((e) => e.direction === "DEBIT");
    const credits = tx.entries.filter((e) => e.direction === "CREDIT");

    const totalDebit = debits.reduce((sum, e) => sum + e.amountPaise, 0);
    const totalCredit = credits.reduce((sum, e) => sum + e.amountPaise, 0);

    assert.strictEqual(totalDebit, 75000);
    assert.strictEqual(totalCredit, 75000);
    assert.strictEqual(debits[0].account, "CUSTOMER_WALLET");
    assert.strictEqual(debits[0].entityId, "usr_sovereign_king");
  });

  test("permits Cash on Delivery (COD) during daytime hours in safe zones with CUSTOMER_CASH_IN debit", async () => {
    const daytimeDate = new Date("2026-10-27T08:30:00.000Z"); // 14:00 IST

    const tx = await canonicalLedger.captureOrderPayment({
      orderId: "ord-test-cod-daytime",
      paymentMethod: "COD",
      totalAmountPaise: 42000, // ₹420.00
      platformFeePaise: 1000,
      deliveryFeePaise: 3500,
      gstPaise: 180,
      restaurantId: "rest-003",
      riderId: "rider-day-101",
      idempotencyKey: "test-idem-cod-daytime-" + Date.now(),
      timestamp: daytimeDate,
      isThreatZone: false,
    });

    assert.ok(tx);
    assert.strictEqual(tx.eventType, "ORDER_COD_COLLECTION_RECORDED");
    const debits = tx.entries.filter((e) => e.direction === "DEBIT");
    const credits = tx.entries.filter((e) => e.direction === "CREDIT");

    const totalDebit = debits.reduce((sum, e) => sum + e.amountPaise, 0);
    const totalCredit = credits.reduce((sum, e) => sum + e.amountPaise, 0);

    assert.strictEqual(totalDebit, 42000);
    assert.strictEqual(totalCredit, 42000);
    assert.strictEqual(debits[0].account, "CUSTOMER_CASH_IN");
    assert.strictEqual(debits[0].entityId, "rider-day-101");
  });

  test("strictly fails closed on fractional paise or negative monetary values", async () => {
    const daytimeDate = new Date("2026-10-27T08:30:00.000Z");

    // Float paise
    await assert.rejects(
      async () => {
        await canonicalLedger.captureOrderPayment({
          orderId: "ord-test-float-paise",
          totalAmountPaise: 450.55 as any,
          platformFeePaise: 10,
          deliveryFeePaise: 35,
          gstPaise: 1,
          restaurantId: "rest-004",
          idempotencyKey: "test-idem-float",
          timestamp: daytimeDate,
        });
      },
      /Total amount must be a positive integer in paise/
    );

    // Negative amount
    await assert.rejects(
      async () => {
        await canonicalLedger.captureOrderPayment({
          orderId: "ord-test-neg-paise",
          totalAmountPaise: -5000,
          platformFeePaise: 10,
          deliveryFeePaise: 35,
          gstPaise: 1,
          restaurantId: "rest-005",
          idempotencyKey: "test-idem-neg",
          timestamp: daytimeDate,
        });
      },
      /Total amount must be a positive integer in paise/
    );
  });

  // =========================================================================
  // FINTECH & SETTLEMENTS SPECIALIST (2b420240): CONCIERGE ADD-ON REVENUE SETTLEMENT
  // =========================================================================
  test("settles Concierge 1-Tap Checkout add-on pairings via double-entry ledger with Sec 9(5) CGST withholding", async () => {
    // 1x Royal Chicken Dum Biryani (28000 paise)
    // + Chilled Mint Raita (4000 paise)
    // + Gulab Jamun (5000 paise)
    // + CCPA Packaging cap (3000 paise)
    // Gross Food & Add-ons = 40,000 paise (₹400.00)
    // Sec 9(5) CGST 5% = 2,000 paise (₹20.00) under GSTIN 18AFXPH9838M1Z9
    // Total Customer Paid = 42,000 paise (₹420.00)
    const tx = await canonicalLedger.recordConciergeOrderSettlement({
      orderId: "ord-concierge-feast-7788",
      restaurantId: "rest-behrouz-788710",
      dishName: "Royal Chicken Dum Biryani",
      dishPricePaise: 28000,
      quantity: 1,
      packagingPaise: 3000,
      addOns: [
        { id: "addon-raita", name: "Chilled Mint Raita", pricePaise: 4000 },
        { id: "addon-gulab-jamun", name: "Gulab Jamun (2 pcs)", pricePaise: 5000 },
      ],
      paymentMethod: "NPCI_UPI",
      npciUpiVpa: "orderking@ybl",
      idempotencyKey: "idem-concierge-settle-" + Date.now(),
      platformCommissionBps: 1000, // 10%
    });

    assert.ok(tx);
    assert.strictEqual(tx.eventType, "CONCIERGE_ORDER_SETTLEMENT_RECORDED");
    assert.strictEqual(tx.totalAmountPaise, 42000);

    const debits = tx.entries.filter((e) => e.direction === "DEBIT");
    const credits = tx.entries.filter((e) => e.direction === "CREDIT");

    const totalDebit = debits.reduce((s, e) => s + e.amountPaise, 0);
    const totalCredit = credits.reduce((s, e) => s + e.amountPaise, 0);

    // Strict Double-Entry Balance
    assert.strictEqual(totalDebit, 42000);
    assert.strictEqual(totalCredit, 42000);

    // Debit Account: Direct NPCI UPI collection
    assert.strictEqual(debits[0].account, "BANK_CLEARING");
    assert.strictEqual(debits[0].amountPaise, 42000);
    assert.strictEqual(debits[0].entityId, "NPCI_UPI:orderking@ybl");

    // Credit 1: Section 9(5) CGST 5% withholding under OrderKing GSTIN
    const sec9_5Entry = credits.find((e) => e.account === "FOOD_GST_9_5_LIABILITY");
    assert.ok(sec9_5Entry);
    assert.strictEqual(sec9_5Entry.amountPaise, 2000); // exactly 5% of 40,000 paise
    assert.strictEqual(sec9_5Entry.entityId, "GSTIN:18AFXPH9838M1Z9");

    // Credit 2: Restaurant payable (Gross 40,000 minus Platform Commission ₹40 + 18% GST ₹7.20 = 4,720 -> 35,280 paise)
    const restEntry = credits.find((e) => e.account === "RESTAURANT_PAYABLE");
    assert.ok(restEntry);
    assert.strictEqual(restEntry.amountPaise, 35280);
    assert.strictEqual(restEntry.entityId, "rest-behrouz-788710");

    // Credit 3 & 4: Platform fee + GST
    const platEntry = credits.find((e) => e.account === "PLATFORM_FEE_REVENUE");
    assert.ok(platEntry);
    assert.strictEqual(platEntry.amountPaise, 4000);

    const gstEntry = credits.find((e) => e.account === "GST_OUTPUT_LIABILITY");
    assert.ok(gstEntry);
    assert.strictEqual(gstEntry.amountPaise, 720);
  });
});
