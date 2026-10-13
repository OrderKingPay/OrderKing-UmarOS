import { describe, it, expect } from "vitest";
import { SovereignLocalProvider } from "./sovereign-local-provider";
import { OpenFrontierProvider } from "./open-frontier-provider";
import { dynamicGenerationRegistry } from "./dynamic-generation-registry";
import { ModelRouterService } from "./index";

describe("Sovereign Local Intelligence Provider", () => {
  const provider = new SovereignLocalProvider();

  it("is always configured and operational", () => {
    expect(provider.isConfigured).toBe(true);
    expect(provider.id).toBe("sovereign-local");
    expect(provider.supportedModels).toContain("sovereign-local-core");
  });

  it("handles conversational tool selection for platform state", async () => {
    const res = await provider.chat({
      messages: [{ role: "user", content: "Show me the platform state and health" }],
      tools: [{ name: "get_platform_state", description: "state", parameters: {} }],
    });

    expect(res.text).toBeDefined();
    expect(res.toolCalls).toBeDefined();
    expect(res.toolCalls?.[0]?.name).toBe("get_platform_state");
    expect(res.usage?.estimatedCostUsd).toBe(0);
  });

  it("handles conversational tool selection for financial reconciliation", async () => {
    const res = await provider.chat({
      messages: [{ role: "user", content: "Reconcile today's financial ledger and volume" }],
      tools: [{ name: "get_financial_reconciliation", description: "fin", parameters: {} }],
    });

    expect(res.toolCalls?.[0]?.name).toBe("get_financial_reconciliation");
  });

  it("executes code generation without crashing", async () => {
    const res = await provider.generateCode({
      language: "typescript",
      specification: "Create an order validation check",
    });

    expect(res.code).toContain("sovereign");
    expect(res.provider).toContain("Sovereign");
  });

  it("generates structured output matching requested keys", async () => {
    const structured = await provider.generateStructuredOutput<{ status: string; id: string }>({
      schema: { status: "string", id: "string" },
      prompt: "Extract status",
    });

    expect(structured.status).toBeDefined();
    expect(structured.id).toBeDefined();
  });
});

describe("Dynamic Generation Registry", () => {
  it("seeds current generation models", () => {
    const models = dynamicGenerationRegistry.listModels();
    expect(models.length).toBeGreaterThanOrEqual(5);

    const gemini = dynamicGenerationRegistry.getModel("gemini-2.5-pro");
    expect(gemini).toBeDefined();
    expect(gemini?.supportsExtendedThinking).toBe(true);
    expect(gemini?.regionalLanguages).toContain("hi");
    expect(gemini?.regionalLanguages).toContain("bn");
  });

  it("filters free tier models accurately", () => {
    const freeModels = dynamicGenerationRegistry.listFreeTierModels();
    const ids = freeModels.map((m) => m.modelId);
    expect(ids).toContain("sovereign-local-core");
    expect(ids).toContain("deepseek-r1-distill-llama-70b");
    expect(ids).toContain("llama-3.3-70b-versatile");
  });

  it("allows runtime registration of new model generations", () => {
    dynamicGenerationRegistry.registerModel({
      modelId: "gpt-5-frontier-preview",
      name: "OpenAI GPT-5 Preview",
      generation: "GEN_4_AUTONOMOUS_AGENTS",
      providerId: "openai",
      supportsExtendedThinking: true,
      contextWindow: 2000000,
      costTier: "FRONTIER_PREMIUM",
      freeTierEligible: false,
      regionalLanguages: ["en", "hi"],
    });

    const registered = dynamicGenerationRegistry.getModel("gpt-5-frontier-preview");
    expect(registered).toBeDefined();
    expect(registered?.contextWindow).toBe(2000000);
  });
});

describe("Model Router Service Fallback Chain", () => {
  it("resolves sovereign local provider when commercial keys are absent", () => {
    const router = new ModelRouterService();
    const p = router.getProvider();
    expect(p).toBeDefined();
    // In local dev without keys, falls back to sovereign-local
    expect(p.isConfigured).toBe(true);
  });

  it("lists all provider statuses including free tiers", () => {
    const router = new ModelRouterService();
    const statuses = router.listProviderStatuses();
    const ids = statuses.map((s) => s.id);
    expect(ids).toContain("gemini");
    expect(ids).toContain("anthropic");
    expect(ids).toContain("openai");
    expect(ids).toContain("open-frontier");
    expect(ids).toContain("sovereign-local");
  });
});
