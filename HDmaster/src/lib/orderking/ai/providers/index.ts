import type { AIProvider, ChatRequest, ChatResponse } from "./provider-interface.ts";
import { GoogleGeminiProvider } from "./gemini-provider.ts";
import { OpenAIProvider } from "./openai-provider.ts";
import { AnthropicProvider } from "./anthropic-provider.ts";
import { XAIProvider } from "./xai-provider.ts";
import { OpenFrontierProvider } from "./open-frontier-provider.ts";
import { SovereignLocalProvider } from "./sovereign-local-provider.ts";
import { dynamicGenerationRegistry } from "./dynamic-generation-registry.ts";

export * from "./provider-interface.ts";
export * from "./gemini-provider.ts";
export * from "./openai-provider.ts";
export * from "./anthropic-provider.ts";
export * from "./xai-provider.ts";
export * from "./open-frontier-provider.ts";
export * from "./sovereign-local-provider.ts";
export * from "./dynamic-generation-registry.ts";

export interface ProviderStatus {
  id: string;
  name: string;
  isConfigured: boolean;
  supportedModels: string[];
  requiredEnvVar: string;
}

export class ModelRouterService {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.providers.set("gemini", new GoogleGeminiProvider());
    this.providers.set("anthropic", new AnthropicProvider());
    this.providers.set("openai", new OpenAIProvider());
    this.providers.set("xai", new XAIProvider());
    this.providers.set("open-frontier", new OpenFrontierProvider());
    this.providers.set("sovereign-local", new SovereignLocalProvider());

    // Register with dynamic registry
    for (const p of this.providers.values()) {
      dynamicGenerationRegistry.registerProvider(p);
    }
  }

  getProvider(preferredId?: string): AIProvider {
    if (preferredId && this.providers.has(preferredId)) {
      const p = this.providers.get(preferredId)!;
      if (p.isConfigured) return p;
    }

    // Auto-fallback hierarchy (Commercial -> Open/Free Tier -> Sovereign Local Core)
    const priority = ["gemini", "anthropic", "openai", "xai", "open-frontier", "sovereign-local"];
    for (const id of priority) {
      const p = this.providers.get(id);
      if (p && p.isConfigured) return p;
    }

    return this.providers.get("sovereign-local") || new SovereignLocalProvider();
  }

  listProviderStatuses(): ProviderStatus[] {
    return [
      {
        id: "gemini",
        name: "Google Gemini 2.0 / 2.5",
        isConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
        supportedModels: ["gemini-2.0-flash", "gemini-2.5-pro"],
        requiredEnvVar: "GEMINI_API_KEY",
      },
      {
        id: "anthropic",
        name: "Anthropic Claude 3.7",
        isConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        supportedModels: ["claude-3-7-sonnet", "claude-3-5-sonnet"],
        requiredEnvVar: "ANTHROPIC_API_KEY",
      },
      {
        id: "openai",
        name: "OpenAI GPT-4o / o3-mini",
        isConfigured: Boolean(process.env.OPENAI_API_KEY),
        supportedModels: ["gpt-4o", "o3-mini"],
        requiredEnvVar: "OPENAI_API_KEY",
      },
      {
        id: "xai",
        name: "xAI Grok 3 / 2",
        isConfigured: Boolean(process.env.XAI_API_KEY),
        supportedModels: ["grok-3", "grok-2"],
        requiredEnvVar: "XAI_API_KEY",
      },
      {
        id: "open-frontier",
        name: "Open Frontier / Groq / OpenRouter / Ollama",
        isConfigured: Boolean(
          process.env.GROQ_API_KEY ||
          process.env.OPENROUTER_API_KEY ||
          process.env.OLLAMA_HOST
        ),
        supportedModels: [
          "llama-3.3-70b-versatile",
          "deepseek-r1-distill-llama-70b",
          "meta-llama/llama-3.3-70b-instruct:free",
          "deepseek/deepseek-r1:free",
        ],
        requiredEnvVar: "GROQ_API_KEY or OPENROUTER_API_KEY or OLLAMA_HOST",
      },
      {
        id: "sovereign-local",
        name: "👑 Sovereign Local Core (100% In-Memory)",
        isConfigured: true,
        supportedModels: ["sovereign-local-core", "sovereign-foodtech-v1", "sovereign-nlp-edge"],
        requiredEnvVar: "None (Zero-cost built-in)",
      },
    ];
  }

  async executeWithFallback(request: ChatRequest, preferredId?: string): Promise<ChatResponse> {
    const p = this.getProvider(preferredId);
    return await p.chat(request);
  }
}

export const modelRouter = new ModelRouterService();
