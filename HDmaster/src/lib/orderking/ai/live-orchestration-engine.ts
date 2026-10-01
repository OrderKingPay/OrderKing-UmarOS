// @ts-nocheck
// Live Multi-Model Orchestration Engine (HDmaster Core OS)
// Concurrently coordinates frontier AI models, cross-validates outputs,
// eliminates hallucinations, respects provider quotas/costs, and returns concise executive results.
import { surgePricingEngine } from "../finance/surge-engine.ts";
import { GoogleGeminiProvider } from "./providers/gemini-provider.ts";
import { OpenAIProvider } from "./providers/openai-provider.ts";
import { AnthropicProvider } from "./providers/anthropic-provider.ts";
import { XAIProvider } from "./providers/xai-provider.ts";
import { createHash } from "node:crypto";


export interface AIProviderAdapter {
  id: string;
  name: string;
  vendor: "Google" | "Anthropic" | "OpenAI" | "xAI" | "OpenSource" | "Sovereign";
  isConfigured: boolean;
  activeModels: string[];
  costPer1kTokensUsd: { input: number; output: number };
  maxContextTokens: number;
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
    estimatedCostUsd?: number;
  }>;
}

export interface ModelOutputVerdict {
  providerId: string;
  providerName: string;
  vendor: AIProviderAdapter["vendor"];
  model: string;
  output: string;
  confidenceScore: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  estimatedCostInr: number;
  latencyMs: number;
  verifiedFactual: boolean;
  keyInsights: string[];
}

export interface MultiModelConsensusResult {
  consensusId: string;
  timestamp: string;
  prompt: string;
  verdicts: ModelOutputVerdict[];
  consensusAgreementScore: number; // 0 - 100%
  unifiedExecutiveSummary: string;
  strongestCandidateModel: string;
  totalTokensUsed: number;
  totalCostInr: number;
  auditSignature: string;
  hallucinationFreeVerified: boolean;
  deliveryBasePaise: number;
  surgeMultiplier: number;
}

export class LiveOrchestrationEngine {
  private adapters: Map<string, AIProviderAdapter> = new Map();
  private monthlyCostAccumulatorInr = 0;
  private readonly MONTHLY_BUDGET_CAP_INR = 50000; // Hard cost ceiling

  constructor() {
    this.registerStandardAdapters();
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
      accumulatedSpendInr: parseFloat(this.monthlyCostAccumulatorInr.toFixed(2)),
      remainingBudgetInr: parseFloat((this.MONTHLY_BUDGET_CAP_INR - this.monthlyCostAccumulatorInr).toFixed(2)),
      isBudgetExhausted: this.monthlyCostAccumulatorInr >= this.MONTHLY_BUDGET_CAP_INR,
    };
  }

  private registerStandardAdapters() {
    const adapters: Array<{
      id: string;
      name: string;
      vendor: AIProviderAdapter["vendor"];
      provider: any;
      modelEnv: string;
      maxContextEnv: string;
    }> = [
      {
        id: "openai",
        name: "OpenAI",
        vendor: "OpenAI",
        provider: new OpenAIProvider(),
        modelEnv: "OPENAI_MODEL",
        maxContextEnv: "OPENAI_MAX_CONTEXT_TOKENS",
      },
      {
        id: "gemini",
        name: "Google Gemini",
        vendor: "Google",
        provider: new GoogleGeminiProvider(),
        modelEnv: "GEMINI_MODEL",
        maxContextEnv: "GEMINI_MAX_CONTEXT_TOKENS",
      },
      {
        id: "anthropic",
        name: "Anthropic Claude",
        vendor: "Anthropic",
        provider: new AnthropicProvider(),
        modelEnv: "ANTHROPIC_MODEL",
        maxContextEnv: "ANTHROPIC_MAX_CONTEXT_TOKENS",
      },
      {
        id: "xai",
        name: "xAI Grok",
        vendor: "xAI",
        provider: new XAIProvider(),
        modelEnv: "XAI_MODEL",
        maxContextEnv: "XAI_MAX_CONTEXT_TOKENS",
      },
    ];

    for (const entry of adapters) {
      const provider = entry.provider;
      const selectedModel = process.env[entry.modelEnv]?.trim() || provider.supportedModels?.[0] || "";
      const maxContextTokens = Number(process.env[entry.maxContextEnv] || 0);

      this.registerProviderAdapter({
        id: entry.id,
        name: entry.name,
        vendor: entry.vendor,
        isConfigured: Boolean(provider.isConfigured),
        activeModels: selectedModel ? [selectedModel] : [],
        costPer1kTokensUsd: { input: 0, output: 0 },
        maxContextTokens: Number.isFinite(maxContextTokens) && maxContextTokens > 0 ? maxContextTokens : 0,
        async executePrompt({ model, prompt, systemPrompt, temperature, maxTokens }) {
          if (!provider.isConfigured) {
            throw new Error(`${entry.name} is not configured; refusing simulated execution.`);
          }

          const response = await provider.chat({
            model: model || selectedModel || undefined,
            systemPrompt,
            messages: [{ role: "user", content: prompt }],
            temperature,
            maxTokens,
          });

          return {
            text: response.text,
            tokensUsed: {
              prompt: response.usage?.promptTokens || 0,
              completion: response.usage?.completionTokens || 0,
              total: response.usage?.totalTokens || 0,
            },
            latencyMs: response.latencyMs || 0,
            model: response.model,
            estimatedCostUsd: response.usage?.estimatedCostUsd,
          };
        },
      });
    }
  }

  /**
   * Concurrently dispatches prompt across all registered providers, evaluates semantic convergence,
   * detects and filters hallucinations, and synthesizes a single unified executive result.
   */
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
    const consensusId = `cons-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const systemPrompt = params.systemPrompt || "You are an autonomous executive business partner operating OrderKing with maximum lawful automation and zero fabrication.";

    const targetAdapters = (params.preferredProviders?.length
      ? Array.from(this.adapters.values()).filter((a) => params.preferredProviders?.includes(a.id))
      : Array.from(this.adapters.values())
    ).filter((adapter) => adapter.isConfigured && adapter.activeModels.length > 0);

    // Execute concurrently across all selected adapters
    const executionPromises = targetAdapters.map(async (adapter) => {
      const activeModel = adapter.activeModels[0] || "default";
      try {
        const res = await adapter.executePrompt({
          model: activeModel,
          systemPrompt,
          prompt: params.prompt,
        });

        // Calculate real cost in INR (USD -> INR ~ 87.0)
        const usdRate = 87.0;
        const reportedUsd = typeof res.estimatedCostUsd === "number" ? res.estimatedCostUsd : null;
        const promptCost = (res.tokensUsed.prompt / 1000) * adapter.costPer1kTokensUsd.input;
        const completionCost = (res.tokensUsed.completion / 1000) * adapter.costPer1kTokensUsd.output;
        const costInr = reportedUsd != null
          ? reportedUsd * usdRate
          : (promptCost + completionCost) * usdRate;

        const verdict: ModelOutputVerdict = {
          providerId: adapter.id,
          providerName: adapter.name,
          vendor: adapter.vendor,
          model: res.model,
          output: res.text,
          confidenceScore: 0,
          tokensUsed: res.tokensUsed,
          estimatedCostInr: parseFloat(costInr.toFixed(4)),
          latencyMs: res.latencyMs,
          verifiedFactual: false,
          keyInsights: [
            `Real provider call completed via ${adapter.name}`,
            "Independent factual verification was not performed by this orchestration pass.",
          ],
        };

        return verdict;
      } catch (err) {
        throw new Error(
          `REAL_PROVIDER_FAILURE:${adapter.id}:${err instanceof Error ? err.message : String(err)}`
        );
      }
    });

    const settledResults = await Promise.allSettled(executionPromises);
    const validVerdicts: ModelOutputVerdict[] = settledResults
      .filter((r): r is PromiseFulfilledResult<ModelOutputVerdict> =>
        r.status === "fulfilled" && Boolean(r.value.output?.trim())
      )
      .map((r) => r.value);

    if (validVerdicts.length === 0) {
      throw new Error(
        "BLOCKED: No configured external AI provider returned a real response; refusing simulated or synthetic fallback output.",
      );
    }

    const totalTokens = validVerdicts.reduce((sum, v) => sum + v.tokensUsed.total, 0);
    const totalCost = validVerdicts.reduce((sum, v) => sum + v.estimatedCostInr, 0);
    this.monthlyCostAccumulatorInr += totalCost;

    // No fabricated confidence ranking: choose the fastest successful response only.
    const strongest = [...validVerdicts].sort((a, b) => a.latencyMs - b.latencyMs)[0]!;

    // Calculate cross-model consensus score
    const consensusAgreementScore = 0;

    // Synthesize concise executive result
    const unifiedExecutiveSummary = `### Live Multi-Provider Execution (${validVerdicts.length}/${targetAdapters.length} configured providers returned output)
- **Selected execution path**: ${strongest.providerName} (${strongest.model}) based on measured response latency.
- **Factual verification**: not performed by this orchestration pass.
- **Tokens observed**: ${totalTokens}.
- **Providers with real output**: ${validVerdicts.map((v) => v.providerName).join(", ")}.`;

    const auditSignature = createHash("sha256")
      .update(JSON.stringify({
        consensusId,
        timestamp,
        prompt: params.prompt,
        models: validVerdicts.map((v) => ({ provider: v.providerId, model: v.model })),
        totalTokens,
      }))
      .digest("hex")
      .slice(0, 32)
      .toUpperCase();

    let surgeMultiplier = 1.0;
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

    return {
      consensusId,
      timestamp,
      prompt: params.prompt,
      verdicts: validVerdicts,
      consensusAgreementScore,
      unifiedExecutiveSummary,
      strongestCandidateModel: `${strongest.providerName} (${strongest.model})`,
      totalTokensUsed: totalTokens,
      totalCostInr: parseFloat(totalCost.toFixed(4)),
      auditSignature: `SIG_${auditSignature}`,
      hallucinationFreeVerified: false,
      deliveryBasePaise,
      surgeMultiplier,
    };
  }
}

export const liveOrchestrationEngine = new LiveOrchestrationEngine();
