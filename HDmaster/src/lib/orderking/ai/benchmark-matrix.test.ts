import { describe, it, expect } from "vitest";
import {
  FRONTIER_MODELS,
  calculateTokenCost,
  calculateCompositeEfficiencyIndex,
  executeBenchmarkRun,
  compareModelsHeadToHead,
  USD_TO_INR_EXCHANGE_RATE,
} from "./benchmark-matrix";

describe("UMAR OS Multimodel Benchmark Matrix & Economic Engine", () => {
  it("verifies accurate frontier model registry profiles", () => {
    expect(FRONTIER_MODELS["gemini-2.5-pro"]).toBeDefined();
    expect(FRONTIER_MODELS["gemini-2.5-flash"]).toBeDefined();
    expect(FRONTIER_MODELS["claude-3-7-sonnet"]).toBeDefined();
    expect(FRONTIER_MODELS["deepseek-v3"]).toBeDefined();
    expect(FRONTIER_MODELS["sovereign-local-core"]).toBeDefined();

    // Verify sovereign local core has zero marginal token cost
    const local = FRONTIER_MODELS["sovereign-local-core"];
    expect(local.inputCostPerMillionUsd).toBe(0);
    expect(local.outputCostPerMillionUsd).toBe(0);
    expect(local.typicalTtftMs).toBeLessThan(50);
  });

  it("calculates precise token costs in USD and INR paise", () => {
    // 100,000 input tokens and 20,000 output tokens on Gemini 2.5 Flash
    // Input: (100k / 1M) * 0.075 = $0.0075
    // Output: (20k / 1M) * 0.30 = $0.006
    // Total USD: $0.0135
    const cost = calculateTokenCost("gemini-2.5-flash", 100_000, 20_000);
    expect(cost.costUsd).toBeCloseTo(0.0135, 4);

    const expectedInr = 0.0135 * USD_TO_INR_EXCHANGE_RATE;
    expect(cost.costInr).toBeCloseTo(expectedInr, 3);
    expect(cost.costInrPaise).toBe(Math.round(expectedInr * 100));
  });

  it("supports context caching discount calculation", () => {
    // 1M input tokens with 800k cached on Gemini 2.5 Pro
    const cost = calculateTokenCost("gemini-2.5-pro", 1_000_000, 10_000, 800_000);
    expect(cost.costUsd).toBeGreaterThan(0);
    
    const uncachedCost = calculateTokenCost("gemini-2.5-pro", 1_000_000, 10_000, 0);
    expect(cost.costUsd).toBeLessThan(uncachedCost.costUsd);
  });

  it("computes bounded composite efficiency index", () => {
    // Perfect accuracy, instant latency, zero cost -> 100.0
    const perfectScore = calculateCompositeEfficiencyIndex(100, 0, 0);
    expect(perfectScore).toBe(100);

    // Degraded performance
    const degradedScore = calculateCompositeEfficiencyIndex(50, 1000, 0.025);
    expect(degradedScore).toBeGreaterThan(0);
    expect(degradedScore).toBeLessThan(100);
  });

  it("executes simulated benchmark runs with deterministic output", () => {
    const run = executeBenchmarkRun("dispatch_optimization", "gemini-2.5-flash", 1.2);
    expect(run.taskId).toContain("bench_dispatch_optimization");
    expect(run.modelId).toBe("gemini-2.5-flash");
    expect(run.latencyMs).toBeGreaterThan(0);
    expect(run.tokensGenerated).toBeGreaterThan(0);
    expect(run.tokensPerSec).toBeGreaterThan(0);
    expect(run.compositeEfficiencyIndex).toBeGreaterThan(50);
  });

  it("compares models head-to-head with accurate savings rationale", () => {
    const comparison = compareModelsHeadToHead(
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      { inputTokens: 5_000_000, outputTokens: 1_000_000 }
    );

    expect(comparison.modelA.name).toBe("Gemini 2.5 Pro");
    expect(comparison.modelB.name).toBe("Gemini 2.5 Flash");
    expect(comparison.savingsPercentage).toBeGreaterThan(50);
    expect(comparison.recommendedModel).toBe("gemini-2.5-flash");
    expect(comparison.rationale).toContain("cost savings");
  });
});
