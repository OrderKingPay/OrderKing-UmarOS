import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { canonicalLedger } from "./canonical-ledger.ts";

describe("Canonical Double-Entry Financial Ledger Engine", () => {
  test("initializes correctly and can list transactions asynchronously", async () => {
    try {
      const transactions = await canonicalLedger.listTransactions();
      assert.ok(Array.isArray(transactions));
    } catch (e: any) {
      if (e.message.includes('DATABASE_URL is missing') || e.message.includes('connect ECONNREFUSED')) return;
      throw e;
    }
  });

  test("can get settlement batches asynchronously", async () => {
    try {
      const batches = await canonicalLedger.listSettlementBatches();
      assert.ok(Array.isArray(batches));
    } catch (e: any) {
      if (e.message.includes('DATABASE_URL is missing') || e.message.includes('connect ECONNREFUSED')) return;
      throw e;
    }
  });
});

