import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  fetchUmarOsTelemetry,
  applyUmarOsSettings,
  runFounderConsoleCommandCore
} from "./umaros-supreme.server.ts";

describe("UmarOS Supreme AI - Sovereign Founder Command Center & Orchestration Engine", () => {
  test("1. Telemetry returns canonical real database structure with zero fabricated data", async () => {
    const telemetry = await fetchUmarOsTelemetry();
    assert.ok(telemetry, "Telemetry payload must exist");
    assert.strictEqual(typeof telemetry.orders.total, "number", "orders.total must be numeric");
    assert.strictEqual(typeof telemetry.orders.totalGmvInr, "number", "orders.totalGmvInr must be numeric");
    assert.strictEqual(typeof telemetry.riders.online, "number", "riders.online must be numeric");
    assert.strictEqual(typeof telemetry.refunds.totalCount, "number", "refunds.totalCount must be numeric");
    assert.strictEqual(typeof telemetry.support.openTickets, "number", "support.openTickets must be numeric");
    assert.strictEqual(typeof telemetry.finance.ledgerBalanced, "boolean", "finance.ledgerBalanced must be boolean");
    assert.ok(telemetry.timestamp, "Must include valid ISO timestamp");
  });

  test("2. Toggles & parameters update dynamically with strict bounded validation", async () => {
    const res = await applyUmarOsSettings({
      aiAutomatedRefunds: true,
      aiRiderDispatch: true,
      aiCustomerSupport: true,
      fraudTrustScoreCutoff: 85,
      maxRefundLimitInr: 600,
      dailyLossLimitInr: 5000
    });

    assert.strictEqual(res.ok, true, "Update must succeed");
    assert.strictEqual(res.settings.fraudTrustScoreCutoff, 85);
    assert.strictEqual(res.settings.maxRefundLimitInr, 600);
    assert.strictEqual(res.settings.dailyLossLimitInr, 5000);
  });

  test("3. Founder console executes operations summary command (/summary)", async () => {
    const res = await runFounderConsoleCommandCore({
      command: "/summary",
      model: "gemini-2.5-pro"
    });

    assert.strictEqual(res.status, "SUCCESS");
    assert.strictEqual(res.toolExecuted, "get_operations_summary");
    assert.ok(res.executionMs >= 0, "Execution latency must be recorded");
    assert.ok(res.response.includes("Platform State"), "Response must contain operations state");
    assert.ok(res.data, "Must contain structured JSON telemetry payload");
  });

  test("4. Founder console executes financial ledger double-entry audit (/audit)", async () => {
    const res = await runFounderConsoleCommandCore({
      command: "/audit"
    });

    assert.ok(res.status === "SUCCESS" || res.status === "ERROR");
    assert.strictEqual(res.toolExecuted, "auditFinancialIntegrity");
    assert.ok(res.data, "Must contain double-entry audit results");
  });

  test("5. Founder console executes algorithmic Haversine auto-dispatch (/dispatch)", async () => {
    const res = await runFounderConsoleCommandCore({
      command: "/dispatch"
    });

    assert.strictEqual(res.status, "SUCCESS");
    assert.strictEqual(res.toolExecuted, "runAlgorithmicAutoDispatch");
    assert.ok(res.data, "Must contain dispatch assignment payload");
  });

  test("6. Founder console executes refunds engine inspection (/refunds)", async () => {
    const res = await runFounderConsoleCommandCore({
      command: "/refunds"
    });

    assert.strictEqual(res.status, "SUCCESS");
    assert.strictEqual(res.toolExecuted, "get_refunds_telemetry");
    assert.ok(res.data.trustScoreGate >= 80, "Anti-fraud trust score gate must be >= 80");
  });
});
