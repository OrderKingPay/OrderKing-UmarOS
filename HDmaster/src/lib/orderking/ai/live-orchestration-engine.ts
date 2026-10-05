// Umar OS real-provider orchestration.
// Only provider adapters that actually execute are counted.
// No synthetic model output, latency, token usage, cost, confidence or "hallucination-free" claims.

import { createHash } from "node:crypto";
import { modelRouter } from "./providers/index.ts";
import type { AIProvider, ChatResponse } from "./providers/provider-interface.ts";

export interface AIProviderAdapter {
  id: string;
  name: string;
  vendor: "Google" | "Anthropic" | "OpenAI" | "xAI";
  isConfigured: boolean;
  activeModels: string[];
  executePrompt(params: {
    model?: string;
    systemPrompt: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<ChatResponse>;
}

export interface ModelOutputVerdict {
  providerId: string;
  providerName: string;
  vendor: AIProviderAdapter["vendor"];
  model: string;
  output: string;
  confidenceScore: number | null;
  tokensUsed: { prompt: number; completion: number; total: number };
  estimatedCostInr: number | null;
  latencyMs: number | null;
  verifiedFactual: boolean;
  keyInsights: string[];
  error?: string;
}

export interface MultiModelConsensusResult {
  status: "SUCCESS" | "PARTIAL" | "NOT_ENABLED";
  consensusId: string;
  timestamp: string;
  prompt: string;
  verdicts: ModelOutputVerdict[];
  consensusAgreementScore: number | null;
  unifiedExecutiveSummary: string;
  strongestCandidateModel: string | null;
  totalTokensUsed: number;
  totalCostInr: number | null;
  auditSignature: string;
  hallucinationFreeVerified: boolean;
  deliveryBasePaise: number;
  surgeMultiplier: number;
}

const PROVIDER_IDS = ["openai", "anthropic", "gemini", "xai"] as const;

export class LiveOrchestrationEngine {
  private monthlyCostAccumulatorUsd = 0;
  private readonly MONTHLY_BUDGET_CAP_USD = 500;

  public listRegisteredAdapters(): AIProviderAdapter[] {
    return PROVIDER_IDS.map((id) => {
      const provider = this.getProvider(id);
      return {
        id,
        name: provider?.name ?? id,
        vendor: id === "gemini" ? "Google" : id === "anthropic" ? "Anthropic" : id === "xai" ? "xAI" : "OpenAI",
        isConfigured: Boolean(provider?.isConfigured),
        activeModels: provider?.supportedModels ?? [],
        async executePrompt(params) {
          if (!provider) throw new Error("Provider unavailable");
          return provider.chat({
            messages: [{ role: "user", content: params.prompt }],
            systemPrompt: params.systemPrompt,
            model: params.model,
            temperature: params.temperature,
            maxTokens: params.maxTokens,
          });
        },
      } as AIProviderAdapter;
    });
  }

  public getAdapter(id: string): AIProviderAdapter | undefined {
    return this.listRegisteredAdapters().find((adapter) => adapter.id === id);
  }

  private getProvider(id: (typeof PROVIDER_IDS)[number]): AIProvider | undefined {
    try {
      return modelRouter.getProvider(id);
    } catch {
      return undefined;
    }
  }

  public getBudgetStatus() {
    return {
      monthlyBudgetCapUsd: this.MONTHLY_BUDGET_CAP_USD,
      accumulatedSpendUsd: Number(this.monthlyCostAccumulatorUsd.toFixed(6)),
      remainingBudgetUsd: Number(Math.max(0, this.MONTHLY_BUDGET_CAP_USD - this.monthlyCostAccumulatorUsd).toFixed(6)),
      isBudgetExhausted: this.monthlyCostAccumulatorUsd >= this.MONTHLY_BUDGET_CAP_USD,
    };
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
    const timestamp = new Date().toISOString();
    const systemPrompt = params.systemPrompt ??
      "You are an OrderKing executive AI. Use only information provided or retrieved by authorized tools. Never claim an action, payment, provider state, location, or legal outcome that is not evidenced.";

    const selectedIds = (params.preferredProviders?.length
      ? PROVIDER_IDS.filter((id) => params.preferredProviders?.includes(id))
      : PROVIDER_IDS);

    if (this.getBudgetStatus().isBudgetExhausted) {
      return {
        status: "NOT_ENABLED",
        consensusId: "budget-blocked",
        timestamp,
        prompt: params.prompt,
        verdicts: [],
        consensusAgreementScore: null,
        unifiedExecutiveSummary: "Multi-provider orchestration is blocked because the configured monthly AI budget has been exhausted.",
        strongestCandidateModel: null,
        totalTokensUsed: 0,
        totalCostInr: null,
        auditSignature: "NOT_SIGNED",
        hallucinationFreeVerified: false,
        deliveryBasePaise: 4000,
        surgeMultiplier: 1,
      };
    }

    const verdicts: ModelOutputVerdict[] = [];
    for (const id of selectedIds) {
      const provider = this.getProvider(id);
      if (!provider?.isConfigured) continue;

      try {
        const response = await provider.chat({
          messages: [{ role: "user", content: params.prompt }],
          systemPrompt,
        });

        const usage = response.usage;
        const costUsd = usage?.estimatedCostUsd;
        if (typeof costUsd === "number" && Number.isFinite(costUsd)) {
          this.monthlyCostAccumulatorUsd += costUsd;
        }

        verdicts.push({
          providerId: response.provider || id,
          providerName: provider.name,
          vendor: id === "gemini" ? "Google" : id === "anthropic" ? "Anthropic" : id === "xai" ? "xAI" : "OpenAI",
          model: response.model || "PROVIDER_REPORTED",
          output: response.text,
          confidenceScore: null,
          tokensUsed: {
            prompt: usage?.promptTokens ?? 0,
            completion: usage?.completionTokens ?? 0,
            total: usage?.totalTokens ?? 0,
          },
          estimatedCostInr: null,
          latencyMs: typeof response.latencyMs === "number" ? response.latencyMs : null,
          verifiedFactual: false,
          keyInsights: ["Executed by a real configured provider. Output has not been independently fact-verified."],
        });
      } catch (error) {
        verdicts.push({
          providerId: id,
          providerName: provider.name,
          vendor: id === "gemini" ? "Google" : id === "anthropic" ? "Anthropic" : id === "xai" ? "xAI" : "OpenAI",
          model: "PROVIDER_ERROR",
          output: "",
          confidenceScore: null,
          tokensUsed: { prompt: 0, completion: 0, total: 0 },
          estimatedCostInr: null,
          latencyMs: null,
          verifiedFactual: false,
          keyInsights: [],
          error: error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240),
        });
      }
    }

    const successful = verdicts.filter((v) => v.output || !v.error);
    const totalTokensUsed = verdicts.reduce((sum, v) => sum + v.tokensUsed.total, 0);
    const successfulNames = successful.map((v) => v.providerName).join(", ");
    const status = successful.length === 0 ? "NOT_ENABLED" : successful.length < selectedIds.length ? "PARTIAL" : "SUCCESS";

    const sourceHash = createHash("sha256")
      .update(JSON.stringify({ prompt: params.prompt, timestamp, verdicts: verdicts.map((v) => ({ providerId: v.providerId, model: v.model, output: v.output })) }))
      .digest("hex");

    let deliveryBasePaise = 4000;
    let surgeMultiplier = 1;
    if (params.surgeParams) {
      // Kept as a deterministic calculation only; it is not presented as real-time
      // pricing authority until live supply/demand inputs are connected.
      const { surgePricingEngine } = await import("../finance/surge-engine.ts");
      const surgeResult = surgePricingEngine.calculateSurge(params.surgeParams);
      surgeMultiplier = surgeResult.multiplier;
      deliveryBasePaise = surgeResult.adjustedDeliveryBasePaise;
    }

    return {
      status,
      consensusId: `cons-${Date.now()}`,
      timestamp,
      prompt: params.prompt,
      verdicts,
      consensusAgreementScore: null,
      unifiedExecutiveSummary:
        successful.length > 0
          ? `Real-provider execution completed across ${successful.length} configured provider(s): ${successfulNames}. Outputs are not independently fact-verified and must not be labeled hallucination-free.`
          : "No configured AI provider completed the request.",
      strongestCandidateModel: successful[0]?.model ?? null,
      totalTokensUsed,
      totalCostInr: null,
      auditSignature: `EVIDENCE_${sourceHash.slice(0, 24).toUpperCase()}`,
      hallucinationFreeVerified: false,
      deliveryBasePaise,
      surgeMultiplier,
    };
  }
}

export const liveOrchestrationEngine = new LiveOrchestrationEngine();
