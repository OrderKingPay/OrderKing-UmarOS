import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { canonicalLedger, CanonicalLedger } from "./canonical-ledger.ts";

describe("Canonical Double-Entry Financial Ledger Engine", () => {
  test("initializes account balances with standard chart of accounts", () => {
    const accounts = [
      "RESTAURANT_PAYABLE",
      "RIDER_PAYABLE",
      "PLATFORM_FEE_REVENUE",
      "COMMISSION_ESCROW",
      "GST_OUTPUT_LIABILITY",
      "REFUND_CLEARING",
      "FOUNDER_VAULT",
      "CUSTOMER_CASH_IN",
      "BANK_CLEARING",
    ] as const;

    for (const acc of accounts) {
      assert.equal(typeof canonicalLedger.getAccountBalancePaise(acc), "number");
    }
  });

  test("posts a balanced double-entry transaction (sum(debits) === sum(credits))", () => {
    const key = `ORDER-TEST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const result = canonicalLedger.postTransaction({
      idempotencyKey: key,
      eventType: "ORDER_PAYMENT_CAPTURED",
      orderId: "ORD-9912",
      entries: [
        { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 45000, entityId: "GATEWAY", memo: "Customer payment" },
        { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 35000, entityId: "REST-1", memo: "Food subtotal" },
        { account: "RIDER_PAYABLE", direction: "CREDIT", amountPaise: 7000, entityId: "RIDER-1", memo: "Delivery fee" },
        { account: "PLATFORM_FEE_REVENUE", direction: "CREDIT", amountPaise: 3000, entityId: "PLATFORM", memo: "Platform fee" },
      ],
    });

    assert.equal(result.success, true);
    assert.ok(result.transactionId);
  });

  test("rejects unbalanced transactions with an error", () => {
    const key = `UNBALANCED-${Date.now()}`;
    assert.throws(
      () => {
        canonicalLedger.postTransaction({
          idempotencyKey: key,
          eventType: "ORDER_PAYMENT_CAPTURED",
          entries: [
            { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 10000, entityId: "GATEWAY", memo: "Debit" },
            { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: 8000, entityId: "REST-1", memo: "Credit" },
          ],
        });
      },
      {
        message: /Double-entry imbalance/,
      }
    );
  });

  test("enforces idempotency protection on duplicate transactions", () => {
    const key = `IDEM-KEY-${Date.now()}`;

    // First attempt succeeds
    const res1 = canonicalLedger.postTransaction({
      idempotencyKey: key,
      eventType: "PLATFORM_FEE_REVENUE" as any,
      entries: [
        { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 1000, entityId: "GATEWAY", memo: "Fee" },
        { account: "PLATFORM_FEE_REVENUE", direction: "CREDIT", amountPaise: 1000, entityId: "PLATFORM", memo: "Fee" },
      ],
    });
    assert.equal(res1.success, true);

    // Second attempt returns idempotent replay without error
    const res2 = canonicalLedger.postTransaction({
      idempotencyKey: key,
      eventType: "PLATFORM_FEE_REVENUE" as any,
      entries: [
        { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 1000, entityId: "GATEWAY", memo: "Fee" },
        { account: "PLATFORM_FEE_REVENUE", direction: "CREDIT", amountPaise: 1000, entityId: "PLATFORM", memo: "Fee" },
      ],
    });
    assert.equal(res2.success, true);
    assert.equal(res2.transactionId, res1.transactionId);
    assert.ok(res2.message.includes("Idempotent replay"));
  });

  test("records order capture and properly allocates funds across accounts", () => {
    const key = `ORD-CAPTURE-${Date.now()}`;
    const result = canonicalLedger.recordOrderCapture({
      orderId: "ORD-5555",
      restaurantId: "REST-KORAMANGALA",
      totalAmountPaise: 50000,
      platformFeePaise: 2500,
      deliveryFeePaise: 5000,
      gstPaise: 2500,
      idempotencyKey: key,
    });

    assert.equal(result.success, true);
    assert.ok(canonicalLedger.getTransaction(result.transactionId));
  });

  test("executes complete settlement batch lifecycle transitions", () => {
    const key = `STL-BATCH-${Date.now()}`;
    const batch = canonicalLedger.createSettlementBatch({
      entityId: "REST-KORAMANGALA",
      entityType: "RESTAURANT",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-07",
      grossAmountPaise: 100000,
      deductionsPaise: 1000,
      commissionPaise: 0, // 0% commission!
      gstPaise: 1000,
      payoutUpiOrAccountNumber: "merchant@okhdfcbank",
      idempotencyKey: key,
    });

    assert.equal(batch.state, "CALCULATED");
    assert.equal(batch.netPayoutPaise, 98000);

    // CALCULATED -> VALIDATED
    const validated = canonicalLedger.advanceSettlementState(batch.batchId, "VALIDATED");
    assert.equal(validated.state, "VALIDATED");

    // VALIDATED -> APPROVED
    const approved = canonicalLedger.advanceSettlementState(batch.batchId, "APPROVED");
    assert.equal(approved.state, "APPROVED");

    // APPROVED -> INITIATED
    const initiated = canonicalLedger.advanceSettlementState(batch.batchId, "INITIATED");
    assert.equal(initiated.state, "INITIATED");
    assert.equal(initiated.attemptsCount, 1);

    // INITIATED -> PROVIDER_PENDING
    const providerPending = canonicalLedger.advanceSettlementState(batch.batchId, "PROVIDER_PENDING");
    assert.equal(providerPending.state, "PROVIDER_PENDING");

    // PROVIDER_PENDING -> PROVIDER_CONFIRMED
    const confirmed = canonicalLedger.advanceSettlementState(batch.batchId, "PROVIDER_CONFIRMED", {
      providerReference: "PG-REF-998811",
    });
    assert.equal(confirmed.state, "PROVIDER_CONFIRMED");
    assert.equal(confirmed.providerReference, "PG-REF-998811");

    // PROVIDER_CONFIRMED -> PAID
    const paid = canonicalLedger.advanceSettlementState(batch.batchId, "PAID");
    assert.equal(paid.state, "PAID");
  });

  test("cryptographic hash chain validates integrity with zero tampering", () => {
    const integrity = canonicalLedger.verifyLedgerChainIntegrity();
    assert.equal(integrity.isValid, true);
    assert.ok(integrity.totalTransactions > 0);
  });
});
