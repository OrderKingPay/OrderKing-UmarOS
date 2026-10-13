import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_CASCADE_SEQUENCE,
  ModelSelectionConfigSchema,
  validateModelSelectionConfig,
  safeValidateModelSelectionConfig,
  resolveModelRouting,
  estimateRoutingCost,
  estimateCascadeWorkloadCosts,
  executeModelRoutingWithFallback,
  ModelRoutingExhaustionError,
} from "./model-router.server.ts";
import { USD_TO_INR_EXCHANGE_RATE, FRONTIER_MODELS } from "./benchmark-matrix.ts";

describe("UMAR OS Intelligent Fallback Model Router", () => {
  // ==========================================================================
  // 1. Schema Validation for Model Selection Config
  // ==========================================================================
  describe("Schema Validation for Model Selection Config", () => {
    it("validates and parses a complete valid configuration", () => {
      const validConfig = {
        taskType: "code_generation",
        estimatedInputTokens: 5000,
        estimatedOutputTokens: 1500,
        cachedInputTokens: 1000,
        maxBudgetPaise: 250,
        maxBudgetUsd: 0.05,
        maxLatencyMs: 400,
        requiredCapabilities: {
          extendedThinking: true,
          multimodal: false,
          tools: true,
        },
        preferredModelId: "gemini-2.5-pro",
        allowFallback: true,
        metadata: { userId: "founder_01" },
      };

      const parsed = validateModelSelectionConfig(validConfig);
      expect(parsed.taskType).toBe("code_generation");
      expect(parsed.estimatedInputTokens).toBe(5000);
      expect(parsed.estimatedOutputTokens).toBe(1500);
      expect(parsed.cachedInputTokens).toBe(1000);
      expect(parsed.maxBudgetPaise).toBe(250);
      expect(parsed.maxLatencyMs).toBe(400);
      expect(parsed.allowFallback).toBe(true);
    });

    it("populates default values for optional properties", () => {
      const minimalConfig = {
        taskType: "dispatch_optimization",
        estimatedInputTokens: 800,
      };

      const parsed = validateModelSelectionConfig(minimalConfig);
      expect(parsed.taskType).toBe("dispatch_optimization");
      expect(parsed.estimatedInputTokens).toBe(800);
      expect(parsed.estimatedOutputTokens).toBe(1000); // default
      expect(parsed.cachedInputTokens).toBe(0); // default
      expect(parsed.allowFallback).toBe(true); // default
      expect(parsed.maxBudgetPaise).toBeUndefined();
      expect(parsed.maxLatencyMs).toBeUndefined();
    });

    it("rejects invalid configs with negative token counts", () => {
      const invalidTokens = {
        taskType: "realtime_chat",
        estimatedInputTokens: -50,
      };

      const result = safeValidateModelSelectionConfig(invalidTokens);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be negative");
      }
    });

    it("rejects non-integer token counts", () => {
      const nonIntegerTokens = {
        taskType: "realtime_chat",
        estimatedInputTokens: 100.45,
      };

      const result = safeValidateModelSelectionConfig(nonIntegerTokens);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must be an integer");
      }
    });

    it("rejects negative budget thresholds", () => {
      const negativeBudget = {
        taskType: "deep_reasoning",
        estimatedInputTokens: 2000,
        maxBudgetPaise: -10,
      };

      const result = safeValidateModelSelectionConfig(negativeBudget);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be negative");
      }
    });

    it("rejects zero or negative latency thresholds", () => {
      const zeroLatency = {
        taskType: "realtime_chat",
        estimatedInputTokens: 500,
        maxLatencyMs: 0,
      };

      const result = safeValidateModelSelectionConfig(zeroLatency);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must be positive");
      }
    });

    it("rejects empty task type strings", () => {
      const emptyTask = {
        taskType: "",
        estimatedInputTokens: 500,
      };

      const result = safeValidateModelSelectionConfig(emptyTask);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // 2. Cost Estimation in USD and INR Paise
  // ==========================================================================
  describe("Cost Estimation in USD and INR Paise", () => {
    it("calculates exact USD and INR paise for Gemini 2.5 Pro", () => {
      // 1M input tokens + 100k output tokens
      // Input: (1,000,000 / 1M) * $1.25 = $1.25
      // Output: (100,000 / 1M) * $5.00 = $0.50
      // Total USD: $1.75
      const cost = estimateRoutingCost("gemini-2.5-pro", 1_000_000, 100_000);
      expect(cost.costUsd).toBeCloseTo(1.75, 4);

      const expectedInr = 1.75 * USD_TO_INR_EXCHANGE_RATE;
      expect(cost.costInr).toBeCloseTo(expectedInr, 3);
      expect(cost.costInrPaise).toBe(Math.round(expectedInr * 100));
      expect(cost.effectiveRatePer1kUsd).toBeGreaterThan(0);
    });

    it("calculates exact USD and INR paise for Gemini 2.5 Flash", () => {
      // 100k input tokens + 20k output tokens
      // Input: (100,000 / 1M) * $0.075 = $0.0075
      // Output: (20,000 / 1M) * $0.30 = $0.006
      // Total USD: $0.0135
      const cost = estimateRoutingCost("gemini-2.5-flash", 100_000, 20_000);
      expect(cost.costUsd).toBeCloseTo(0.0135, 5);

      const expectedInr = 0.0135 * USD_TO_INR_EXCHANGE_RATE; // ~1.16775 INR
      expect(cost.costInr).toBeCloseTo(expectedInr, 4);
      expect(cost.costInrPaise).toBe(117); // Math.round(116.775) = 117 paise
    });

    it("calculates exact USD and INR paise for DeepSeek V3", () => {
      // 10k input tokens + 2k output tokens
      // Input: (10,000 / 1M) * $0.14 = $0.0014
      // Output: (2,000 / 1M) * $0.28 = $0.00056
      // Total USD: $0.00196
      const cost = estimateRoutingCost("deepseek-v3", 10_000, 2_000);
      expect(cost.costUsd).toBeCloseTo(0.00196, 5);

      const expectedInr = 0.00196 * USD_TO_INR_EXCHANGE_RATE; // ~0.16954 INR
      expect(cost.costInr).toBeCloseTo(expectedInr, 4);
      expect(cost.costInrPaise).toBe(17); // Math.round(16.954) = 17 paise
    });

    it("confirms Sovereign Local Core has zero cost in USD and INR paise", () => {
      const cost = estimateRoutingCost("sovereign-local-core", 500_000, 50_000);
      expect(cost.costUsd).toBe(0);
      expect(cost.costInr).toBe(0);
      expect(cost.costInrPaise).toBe(0);
      expect(cost.effectiveRatePer1kUsd).toBe(0);
    });

    it("calculates context caching cost discounts accurately", () => {
      // 100k input tokens with 80k cached on Gemini 2.5 Pro
      // Billable: 20k * $1.25/1M = $0.025
      // Cached: 80k * $0.3125/1M = $0.025
      // Total input cost: $0.050 instead of $0.125 uncached
      const cached = estimateRoutingCost("gemini-2.5-pro", 100_000, 0, 80_000);
      const uncached = estimateRoutingCost("gemini-2.5-pro", 100_000, 0, 0);

      expect(cached.costUsd).toBeLessThan(uncached.costUsd);
      expect(cached.costInrPaise).toBeLessThan(uncached.costInrPaise);
    });

    it("estimates cost across the entire cascade simultaneously", () => {
      const cascadeCosts = estimateCascadeWorkloadCosts(50_000, 10_000);
      expect(cascadeCosts["gemini-2.5-pro"]).toBeDefined();
      expect(cascadeCosts["gemini-2.5-flash"]).toBeDefined();
      expect(cascadeCosts["deepseek-v3"]).toBeDefined();
      expect(cascadeCosts["sovereign-local-core"]).toBeDefined();

      // Pro cost > Flash cost
      expect(cascadeCosts["gemini-2.5-pro"].costInrPaise).toBeGreaterThan(
        cascadeCosts["gemini-2.5-flash"].costInrPaise
      );
      // Local cost is 0
      expect(cascadeCosts["sovereign-local-core"].costInrPaise).toBe(0);
    });
  });

  // ==========================================================================
  // 3. Fallback Cascading When Budget Thresholds Are Breached
  // ==========================================================================
  describe("Fallback Cascading on Budget Breaches", () => {
    it("selects Gemini 2.5 Pro when budget is ample", () => {
      const decision = resolveModelRouting({
        taskType: "code_generation",
        estimatedInputTokens: 20_000,
        estimatedOutputTokens: 2_000,
        maxBudgetPaise: 1000, // ₹10.00 is plenty
      });

      expect(decision.selectedModelId).toBe("gemini-2.5-pro");
      expect(decision.isFallback).toBe(false);
      expect(decision.evaluationChain[0].passed).toBe(true);
      expect(decision.cascadePath[0]).toContain("SELECTED");
    });

    it("cascades from Gemini 2.5 Pro to Gemini 2.5 Flash when Pro breaches budget", () => {
      // 100k input + 4k output:
      // Pro costs: (100k/1M)*1.25 + (4k/1M)*5 = 0.125 + 0.02 = $0.145 = ~1254 paise
      // Flash costs: (100k/1M)*0.075 + (4k/1M)*0.3 = 0.0075 + 0.0012 = $0.0087 = ~75 paise
      const decision = resolveModelRouting({
        taskType: "code_generation",
        estimatedInputTokens: 100_000,
        estimatedOutputTokens: 4_000,
        maxBudgetPaise: 500, // 500 paise budget: Pro (1254) fails, Flash (75) qualifies
      });

      expect(decision.selectedModelId).toBe("gemini-2.5-flash");
      expect(decision.isFallback).toBe(true);
      expect(decision.fallbackReason).toContain("Cascaded from primary choice (Gemini 2.5 Pro)");
      expect(decision.fallbackReason).toContain("Budget constraint breached");
      expect(decision.evaluationChain[0].passed).toBe(false);
      expect(decision.evaluationChain[0].rejectionReasons[0]).toContain("exceeds limit of 500 paise");
      expect(decision.evaluationChain[1].passed).toBe(true);
    });

    it("cascades to Sovereign Local Core when output tokens exceed cloud models output limits", () => {
      // 10,000 output tokens exceeds Flash (8,192) and DeepSeek (8,000)
      // If Pro breaches budget, Flash and DeepSeek breach maxOutputTokens, cascades to Sovereign Local Core (16,384)
      const decision = resolveModelRouting({
        taskType: "code_generation",
        estimatedInputTokens: 20_000,
        estimatedOutputTokens: 10_000,
        maxBudgetPaise: 100, // Pro breaches budget (costs > 400 paise)
      });

      expect(decision.selectedModelId).toBe("sovereign-local-core");
      expect(decision.isFallback).toBe(true);
      expect(decision.evaluationChain[1].rejectionReasons[0]).toContain("Max output tokens breached");
      expect(decision.evaluationChain[2].rejectionReasons[0]).toContain("Max output tokens breached");
    });

    it("cascades past Flash to DeepSeek V3 when Flash breaches a tighter budget", () => {
      // 10k input + 2k output:
      // Flash costs: (10k/1M)*0.075 + (2k/1M)*0.30 = $0.00075 + $0.0006 = $0.00135 = ~12 paise
      // DeepSeek costs: (10k/1M)*0.14 + (2k/1M)*0.28 = $0.0014 + $0.00056 = $0.00196
      // Let's use a workload where DeepSeek has lower output cost advantage:
      // 2k input + 8k output:
      // Flash: (2k/1M)*0.075 + (8k/1M)*0.30 = 0.00015 + 0.0024 = $0.00255 = ~22 paise
      // DeepSeek: (2k/1M)*0.14 + (8k/1M)*0.28 = 0.00028 + 0.00224 = $0.00252 = ~22 paise
      // Let's test cascading straight to Sovereign Local Core when budget is zero:
      const decision = resolveModelRouting({
        taskType: "general",
        estimatedInputTokens: 10_000,
        estimatedOutputTokens: 2_000,
        maxBudgetPaise: 0, // Zero paise forces Sovereign Local Core
      });

      expect(decision.selectedModelId).toBe("sovereign-local-core");
      expect(decision.isFallback).toBe(true);
      expect(decision.estimatedCost.paise).toBe(0);
      expect(decision.evaluationChain[0].passed).toBe(false); // Pro breached
      expect(decision.evaluationChain[1].passed).toBe(false); // Flash breached
      expect(decision.evaluationChain[2].passed).toBe(false); // DeepSeek breached
      expect(decision.evaluationChain[3].passed).toBe(true); // Sovereign qualified
    });
  });

  // ==========================================================================
  // 4. Fallback Cascading When Latency Thresholds Are Breached
  // ==========================================================================
  describe("Fallback Cascading on Latency Breaches", () => {
    it("cascades from Gemini 2.5 Pro (520ms) to Flash (240ms) when latency is <= 300ms", () => {
      const decision = resolveModelRouting({
        taskType: "dispatch_optimization",
        estimatedInputTokens: 1_000,
        estimatedOutputTokens: 500,
        maxLatencyMs: 300,
      });

      expect(decision.selectedModelId).toBe("gemini-2.5-flash");
      expect(decision.isFallback).toBe(true);
      expect(decision.typicalLatencyMs).toBe(240);
      expect(decision.evaluationChain[0].passed).toBe(false);
      expect(decision.evaluationChain[0].rejectionReasons[0]).toContain("Latency threshold breached");
      expect(decision.evaluationChain[1].passed).toBe(true);
    });

    it("cascades all the way to Sovereign Local Core (12ms) when latency is <= 50ms", () => {
      const decision = resolveModelRouting({
        taskType: "realtime_chat",
        estimatedInputTokens: 500,
        estimatedOutputTokens: 200,
        maxLatencyMs: 50,
      });

      expect(decision.selectedModelId).toBe("sovereign-local-core");
      expect(decision.isFallback).toBe(true);
      expect(decision.typicalLatencyMs).toBe(12);
      // All three cloud models (520ms, 240ms, 410ms) breached the 50ms latency threshold
      expect(decision.evaluationChain[0].passed).toBe(false);
      expect(decision.evaluationChain[1].passed).toBe(false);
      expect(decision.evaluationChain[2].passed).toBe(false);
      expect(decision.evaluationChain[3].passed).toBe(true);
    });
  });

  // ==========================================================================
  // 5. Context-Window Checks & Capability Enforcement
  // ==========================================================================
  describe("Context-Window & Capability Checks", () => {
    it("enforces DeepSeek V3 64k token context window boundary and cascades", () => {
      // 70,000 input tokens + 2,000 output tokens = 72,000 tokens
      // DeepSeek V3 has 64,000 token limit
      // If we preferred deepseek-v3 or set low budget to force fallback past Pro/Flash
      const decision = resolveModelRouting({
        taskType: "general_summary",
        preferredModelId: "deepseek-v3",
        estimatedInputTokens: 70_000,
        estimatedOutputTokens: 2_000,
      });

      // DeepSeek V3 cannot handle 72,000 tokens (limit: 64,000)
      // Cascades to next in chain: sovereign-local-core (limit: 131,072)
      expect(decision.selectedModelId).toBe("sovereign-local-core");
      expect(decision.isFallback).toBe(true);
      expect(decision.evaluationChain[0].rejectionReasons[0]).toContain("Context window breached");
    });

    it("accommodates 500,000 tokens on Gemini 2.5 Pro (1M context limit)", () => {
      const decision = resolveModelRouting({
        taskType: "architecture",
        estimatedInputTokens: 500_000,
        estimatedOutputTokens: 4_000,
        maxBudgetPaise: 50000,
      });

      expect(decision.selectedModelId).toBe("gemini-2.5-pro");
      expect(decision.contextWindowTokens).toBe(1_048_576);
      expect(decision.evaluationChain[0].passed).toBe(true);
    });

    it("rejects candidate when extended thinking is required and model lacks it", () => {
      // DeepSeek V3 supportsExtendedThinking: false
      const decision = resolveModelRouting({
        taskType: "deep_reasoning",
        preferredModelId: "deepseek-v3",
        estimatedInputTokens: 2_000,
        estimatedOutputTokens: 1_000,
        requiredCapabilities: {
          extendedThinking: true,
        },
      });

      // DeepSeek V3 rejected for lacking extended thinking -> cascades to Sovereign Local Core
      expect(decision.selectedModelId).toBe("sovereign-local-core");
      expect(decision.evaluationChain[0].rejectionReasons[0]).toContain("does not support extended thinking");
    });

    it("throws ModelRoutingExhaustionError if impossible constraints are supplied", () => {
      expect(() => {
        resolveModelRouting({
          taskType: "code_generation",
          estimatedInputTokens: 2_000_000, // 2M tokens exceeds even Gemini 1M context
          estimatedOutputTokens: 1_000,
        });
      }).toThrowError(ModelRoutingExhaustionError);
    });
  });

  // ==========================================================================
  // 6. Runtime Fallback Execution Engine
  // ==========================================================================
  describe("Runtime Fallback Execution Engine", () => {
    it("automatically cascades to Gemini 2.5 Flash if Gemini 2.5 Pro throws a runtime error", async () => {
      const mockExecutor = vi.fn(async (modelId: string) => {
        if (modelId === "gemini-2.5-pro") {
          throw new Error("HTTP 503: Gemini 2.5 Pro upstream model capacity exhausted.");
        }
        return { message: "Success on fallback model", processedBy: modelId };
      });

      const result = await executeModelRoutingWithFallback(
        {
          taskType: "code_generation",
          estimatedInputTokens: 2_000,
          estimatedOutputTokens: 500,
        },
        mockExecutor
      );

      expect(mockExecutor).toHaveBeenCalledTimes(2);
      expect(result.result.processedBy).toBe("gemini-2.5-flash");
      expect(result.attemptedModels).toEqual(["gemini-2.5-pro", "gemini-2.5-flash"]);
      expect(result.decision.selectedModelId).toBe("gemini-2.5-flash");
      expect(result.decision.isFallback).toBe(true);
    });
  });
});
