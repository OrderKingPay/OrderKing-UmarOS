import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { SystemDiagnosticsEngine } from "./system-diagnostics.ts";

describe("System Self-Diagnostics & Observability Engine", () => {
  test("runs comprehensive diagnostics across all 6 core subsystems", () => {
    const report = SystemDiagnosticsEngine.runFullDiagnostics();

    assert.ok(report.evaluatedAt);
    assert.ok(report.healthScore >= 0 && report.healthScore <= 100);
    assert.ok(["HEALTHY", "DEGRADED", "CRITICAL", "DOWN"].includes(report.overallStatus));

    // Verify all 6 components are inspected
    const componentIds = report.components.map((c) => c.componentId);
    assert.ok(componentIds.includes("canonical_ledger"));
    assert.ok(componentIds.includes("ai_workforce"));
    assert.ok(componentIds.includes("founder_privacy_shield"));
    assert.ok(componentIds.includes("order_state_machine"));
    assert.ok(componentIds.includes("rider_fleet_dispatch"));
    assert.ok(componentIds.includes("infrastructure_db"));

    // Verify summary statistics
    assert.equal(
      report.summary.healthyComponents + report.summary.degradedComponents + report.summary.criticalComponents,
      report.components.length
    );
    assert.ok(report.summary.p99LatencyMs > 0);
  });

  test("records and retrieves operational changes for change-tracking audits", () => {
    SystemDiagnosticsEngine.recordChange("FOUNDER_AI", "CONFIG_UPDATE", "Increased surge rate in North Zone");

    const report = SystemDiagnosticsEngine.runFullDiagnostics();
    assert.ok(report.recentChanges.length > 0);

    const latest = report.recentChanges[0];
    assert.equal(latest.actor, "FOUNDER_AI");
    assert.equal(latest.action, "CONFIG_UPDATE");
    assert.equal(latest.details, "Increased surge rate in North Zone");
  });
});
