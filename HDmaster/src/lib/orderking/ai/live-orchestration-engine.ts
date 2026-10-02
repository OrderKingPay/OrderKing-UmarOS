// Umar OS live orchestration.
// Truth boundary: only verified external provider responses enter this engine.
// No local/fabricated model responses, synthetic latency, synthetic token counts,
// fake confidence scores, or "hallucination-free" claims are emitted.

import { OpenAIProvider } from "./providers/openai-provider.ts";
import { surgePricingEngine } from "../finance/surge-engine.ts";

export interface AIProviderAdapter {
  id: string;
  name: string;
  vendor: "OpenAI";
  isConfigured: boolean;
  activeModels: string[];
  executePrompt(params: {
    model: string;
    systemPrompt: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    text: string;
    tokensUsed: { prompt: number; completion: number; total: number };
    latencyMs: number;
    model: string;
  }>;
}

export interface ModelOutputVerdict {
  providerId: string;
  providerName: string;
  vendor: "OpenAI";
  model: string;
  output: string;
  confidenceScore: number | null;
  tokensUsed: { prompt: number; completion: number; total: number };
  estimatedCostInr: number | null;
  latencyMs: number;
  verifiedFactual: boolean;
  keyInsights: string[];
}

export interface MultiModelConsensusResult {
  consensusId: string;
  timestamp: string;
  prompt: string;
  verdicts: ModelOutputVerdict[];
  consensusAgreementScore: number | null;
  unifiedExecutiveSummary: string;
  strongestCandidateModel: string;
  totalTokensUsed: number;
  totalCostInr: number | null;
  auditSignature: string;
  hallucinationFreeVerified: boolean;
  deliveryBasePaise: number;
  surgeMultiplier: number;
}

export class LiveOrchestrationEngine {
  private readonly adapters = new Map<string, AIProviderAdapter>();
  private monthlyCostAccumulatorInr = 0;
  private readonly MONTHLY_BUDGET_CAP_INR = 50000;

  constructor() {
    this.registerOpenAiAdapter();
  }

  public registerProviderAdapter(adapter: AIProviderAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(id: string): AIProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  public listRegisteredAdapters(): AIProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getBudgetStatus() {
    return {
      monthlyBudgetCapInr: this.MONTHLY_BUDGET_CAP_INR,
      accumulatedSpendInr: Number(this.monthlyCostAccumulatorInr.toFixed(2)),
      remainingBudgetInr: Number(Math.max(0, this.MONTHLY_BUDGET_CAP_INR - this.monthlyCostAccumulatorInr).toFixed(2)),
      isBudgetExhausted: this.monthlyCostAccumulatorInr >= this.MONTHLY_BUDGET_CAP_INR,
      costStatus: "UNVERIFIED_UNTIL_PROVIDER_PRICING_IS_CONFIGURED",
    };
  }

  private registerOpenAiAdapter() {
    const provider = new OpenAIProvider();
    this.registerProviderAdapter({
      id: "openai",
      name: provider.name,
      vendor: "OpenAI",
      isConfigured: provider.isConfigured,
      activeModels: provider.supportedModels,
      async executePrompt({ model, systemPrompt, prompt, temperature, maxTokens }) {
        const started = Date.now();
        const response = await provider.chat({
          model,
          systemPrompt,
          temperature,
          maxTokens,
          messages: [{ role: "user", content: prompt }],
        });
        return {
          text: response.text,
          tokensUsed: {
            prompt: response.usage?.promptTokens ?? 0,
            completion: response.usage?.completionTokens ?? 0,
            total: response.usage?.totalTokens ?? 0,
          },
          latencyMs: response.latencyMs ?? Date.now() - started,
          model: response.model,
        };
      },
    });
  }

  public async executeMultiModelConsensus(params: {
    prompt: string;
    systemPrompt?: string;
    preferredProviders?: string[];
    surgeParams?: {
      riderSupplyDensity: number;
      incomingOrderVelocity: number;
      weatherConditionMultiplier?: number;
      timeOfDayMultiplier?: number;
    };
  }): Promise<MultiModelConsensusResult> {
    const adapter = this.adapters.get("openai");
    if (!adapter?.isConfigured) {
      throw new Error("BLOCKED: OPENAI_API_KEY is not configured. No simulated/local AI fallback is allowed.");
    }
    if (params.preferredProviders?.length && !params.preferredProviders.includes("openai")) {
      throw new Error("BLOCKED: Umar OS requires OpenAI for the live orchestration path.");
    }

    const model = adapter.activeModels.includes("gpt-5.6-luna")
      ? "gpt-5.6-luna"
      : adapter.activeModels[0];
    if (!model) throw new Error("BLOCKED: No OpenAI model is configured for Umar OS.");

    const response = await adapter.executePrompt({
      model,
      systemPrompt:
        params.systemPrompt ??
        "You are Umar OS executive intelligence. Use only the supplied evidence. Never invent facts, actions, metrics, approvals, costs, or provider status.",
      prompt: params.prompt,
    });

    const consensusId = `openai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const verdict: ModelOutputVerdict = {
      providerId: adapter.id,
      providerName: adapter.name,
      vendor: "OpenAI",
      model: response.model,
      output: response.text,
      confidenceScore: null,
      tokensUsed: response.tokensUsed,
      estimatedCostInr: null,
      latencyMs: response.latencyMs,
      verifiedFactual: false,
      keyInsights: ["Real OpenAI response received.", "Factual correctness was not independently verified by a second provider."],
    };

    let surgeMultiplier = 1;
    let deliveryBasePaise = 4000;
    if (params.surgeParams) {
      const surgeResult = surgePricingEngine.calculateSurge({
        riderSupplyDensity: params.surgeParams.riderSupplyDensity,
        incomingOrderVelocity: params.surgeParams.incomingOrderVelocity,
        weatherConditionMultiplier: params.surgeParams.weatherConditionMultiplier,
        timeOfDayMultiplier: params.surgeParams.timeOfDayMultiplier,
      });
      surgeMultiplier = surgeResult.multiplier;
      deliveryBasePaise = surgeResult.adjustedDeliveryBasePaise;
    }

    const auditSignature = `SIG_${Date.now().toString(36).toUpperCase()}`;
    return {
      consensusId,
      timestamp: new Date().toISOString(),
      prompt: params.prompt,
      verdicts: [verdict],
      consensusAgreementScore: null,
      unifiedExecutiveSummary: "Live OpenAI result received. No multi-provider consensus or hallucination-free verification is claimed.",
      strongestCandidateModel: `OpenAI (${response.model})`,
      totalTokensUsed: response.tokensUsed.total,
      totalCostInr: null,
      auditSignature,
      hallucinationFreeVerified: false,
      deliveryBasePaise,
      surgeMultiplier,
    };
  }
}

export const liveOrchestrationEngine = new LiveOrchestrationEngine();
