import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { aiWorkforceOrchestrator } from "./ai-workforce-orchestrator.ts";

describe("Autonomous AI Workforce Supergraph Orchestrator", () => {
  test("initializes specialized autonomous agents with distinct permissions", () => {
    const agents = aiWorkforceOrchestrator.listAgents();
    assert.equal(agents.length, 9);

    const roles = agents.map((a) => a.role);
    assert.ok(roles.includes("FOUNDER_AI"));
    assert.ok(roles.includes("FINANCE_AI"));
    assert.ok(roles.includes("OPERATIONS_AI"));
    assert.ok(roles.includes("REPORTING_AI"));
    assert.ok(roles.includes("DISPATCH_AI"));
    assert.ok(roles.includes("RESTAURANT_SUCCESS_AI"));
    assert.ok(roles.includes("QA_AI"));
    assert.ok(roles.includes("SUPPORT_AI"));
    assert.ok(roles.includes("RECONCILIATION_AI"));
  });

  test("submits and executes an autonomous task within normal operational limits", async () => {
    const task = aiWorkforceOrchestrator.assignTask({
      role: "OPERATIONS_AI",
      title: "Inspect Kitchen Prep Times",
      instructions: "Analyze prep durations for evening dinner rush in Koramangala",
      priority: "NORMAL",
      inputPayload: { zone: "Central" },
    });

    assert.ok(task.taskId);
    assert.equal(task.assignedRole, "OPERATIONS_AI");
    assert.equal(task.state, "CREATED");

    const executed = await aiWorkforceOrchestrator.executeTask(task.taskId);
    assert.equal(executed.state, "COMPLETED");
    assert.ok(executed.completedAt);
    assert.ok(executed.executionLogs.length > 0);
  });

  test("enforces Founder Approval Gate for high-risk financial tasks exceeding ₹200 threshold", async () => {
    // Task involving financial settlement of ₹15,000 (exceeds ₹200 limit)
    const task = aiWorkforceOrchestrator.assignTask({
      role: "FINANCE_AI",
      title: "Disburse High-Value Restaurant Settlement",
      instructions: "Trigger bank transfer for Spice Garden Kitchen",
      priority: "HIGH",
      inputPayload: { amountInr: 15000, restaurantId: "REST-001" }, // ₹15,000 > ₹200
    });

    const executed = await aiWorkforceOrchestrator.executeTask(task.taskId);
    assert.equal(executed.state, "WAITING_FOR_APPROVAL");
    assert.ok(executed.gateRequestId);
  });

  test("supports task cancellation and lifecycle tracking", () => {
    const task = aiWorkforceOrchestrator.assignTask({
      role: "SUPPORT_AI",
      title: "Triage High-Volume Customer Tickets",
      instructions: "Batch process ticket responses",
      priority: "LOW",
    });

    // Cancel task
    const cancelled = aiWorkforceOrchestrator.cancelTask(task.taskId, "Founder intervened");
    assert.equal(cancelled.state, "CANCELLED");

    // Check retrieved task
    const retrieved = aiWorkforceOrchestrator.getTask(task.taskId);
    assert.equal(retrieved?.state, "CANCELLED");
  });

  test("supports agent pause and resume commands", () => {
    aiWorkforceOrchestrator.pauseAgent("DISPATCH_AI");
    const agentPaused = aiWorkforceOrchestrator.getAgent("DISPATCH_AI");
    assert.equal(agentPaused?.isPaused, true);

    aiWorkforceOrchestrator.resumeAgent("DISPATCH_AI");
    const agentResumed = aiWorkforceOrchestrator.getAgent("DISPATCH_AI");
    assert.equal(agentResumed?.isPaused, false);
  });
});
