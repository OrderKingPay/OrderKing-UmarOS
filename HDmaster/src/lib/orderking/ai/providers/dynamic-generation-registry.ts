import type { AIProvider } from "./provider-interface.ts";

export interface ModelGenerationMetadata {
  modelId: string;
  name: string;
  generation: "GEN_1_LEGACY" | "GEN_2_MULTIMODAL" | "GEN_3_FRONTIER_REASONING" | "GEN_4_AUTONOMOUS_AGENTS" | "GEN_5_SOVEREIGN_SUPERINTELLIGENCE";
  providerId: string;
  supportsExtendedThinking: boolean;
  contextWindow: number;
  costTier: "FREE_TIER" | "MICRO_CENT" | "COMMERCIAL_STANDARD" | "FRONTIER_PREMIUM";
  freeTierEligible: boolean;
  regionalLanguages: string[]; // ['en', 'hi', 'bn', 'as', 'te', 'ta']
}

export class DynamicGenerationRegistry {
  private registeredModels: Map<string, ModelGenerationMetadata> = new Map();
  private dynamicProviders: Map<string, AIProvider> = new Map();

  constructor() {
    this.seedDefaultGenerations();
  }

  private seedDefaultGenerations() {
    // Generation 3: Frontier Reasoning (Current Industry Standard)
    this.registerModel({
      modelId: "gemini-2.5-pro",
      name: "Google Gemini 2.5 Pro",
      generation: "GEN_3_FRONTIER_REASONING",
      providerId: "gemini",
      supportsExtendedThinking: true,
      contextWindow: 1048576,
      costTier: "COMMERCIAL_STANDARD",
      freeTierEligible: true, // Free tier in Google AI Studio
      regionalLanguages: ["en", "hi", "bn", "as", "ta", "te"],
    });

    this.registerModel({
      modelId: "gemini-2.5-flash",
      name: "Google Gemini 2.5 Flash",
      generation: "GEN_3_FRONTIER_REASONING",
      providerId: "gemini",
      supportsExtendedThinking: true,
      contextWindow: 1048576,
      costTier: "MICRO_CENT",
      freeTierEligible: true,
      regionalLanguages: ["en", "hi", "bn", "as", "ta", "te"],
    });

    this.registerModel({
      modelId: "claude-3-7-sonnet",
      name: "Anthropic Claude 3.7 Sonnet",
      generation: "GEN_3_FRONTIER_REASONING",
      providerId: "anthropic",
      supportsExtendedThinking: true,
      contextWindow: 200000,
      costTier: "FRONTIER_PREMIUM",
      freeTierEligible: false,
      regionalLanguages: ["en", "hi", "bn"],
    });

    this.registerModel({
      modelId: "deepseek-r1-distill-llama-70b",
      name: "DeepSeek R1 (Llama 70B Distill)",
      generation: "GEN_3_FRONTIER_REASONING",
      providerId: "open-frontier",
      supportsExtendedThinking: true,
      contextWindow: 128000,
      costTier: "FREE_TIER",
      freeTierEligible: true, // Available free on Groq and OpenRouter
      regionalLanguages: ["en", "hi", "bn", "as"],
    });

    this.registerModel({
      modelId: "llama-3.3-70b-versatile",
      name: "Meta Llama 3.3 70B",
      generation: "GEN_3_FRONTIER_REASONING",
      providerId: "open-frontier",
      supportsExtendedThinking: false,
      contextWindow: 128000,
      costTier: "FREE_TIER",
      freeTierEligible: true,
      regionalLanguages: ["en", "hi", "bn", "as", "ta", "te"],
    });

    // Generation 4 / Sovereign: 100% In-Memory Offline Resilient
    this.registerModel({
      modelId: "sovereign-local-core",
      name: "👑 Sovereign Local Core",
      generation: "GEN_5_SOVEREIGN_SUPERINTELLIGENCE",
      providerId: "sovereign-local",
      supportsExtendedThinking: true,
      contextWindow: 131072,
      costTier: "FREE_TIER",
      freeTierEligible: true,
      regionalLanguages: ["en", "hi", "bn", "as", "ta", "te", "mr", "gu"],
    });
  }

  registerModel(meta: ModelGenerationMetadata) {
    this.registeredModels.set(meta.modelId, meta);
  }

  registerProvider(provider: AIProvider) {
    this.dynamicProviders.set(provider.id, provider);
  }

  getModel(modelId: string): ModelGenerationMetadata | undefined {
    return this.registeredModels.get(modelId);
  }

  listModels(generationFilter?: string): ModelGenerationMetadata[] {
    const list = Array.from(this.registeredModels.values());
    if (generationFilter) {
      return list.filter((m) => m.generation === generationFilter);
    }
    return list;
  }

  listFreeTierModels(): ModelGenerationMetadata[] {
    return Array.from(this.registeredModels.values()).filter((m) => m.freeTierEligible);
  }

  getProvider(providerId: string): AIProvider | undefined {
    return this.dynamicProviders.get(providerId);
  }
}

export const dynamicGenerationRegistry = new DynamicGenerationRegistry();
