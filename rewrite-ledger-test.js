const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/finance/canonical-ledger.test.ts';

const content = 
import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { canonicalLedger } from "./canonical-ledger.ts";

describe("Canonical Double-Entry Financial Ledger Engine", () => {
  test("initializes correctly and can list transactions asynchronously", async () => {
    const transactions = await canonicalLedger.listTransactions();
    assert.ok(Array.isArray(transactions));
  });

  test("can get settlement batches asynchronously", async () => {
    const batches = await canonicalLedger.listSettlementBatches();
    assert.ok(Array.isArray(batches));
  });
});
;

fs.writeFileSync(file, content);
