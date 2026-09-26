import type { AIProvider, ChatRequest, ChatResponse } from "./provider-interface.ts";
import { GoogleGeminiProvider } from "./gemini-provider.ts";
import { OpenAIProvider } from "./openai-provider.ts";
import { AnthropicProvider } from "./anthropic-provider.ts";
import { XAIProvider } from "./xai-provider.ts";

export * from "./provider-interface.ts";
export * from "./gemini-provider.ts";
export * from "./openai-provider.ts";
export * from "./anthropic-provider.ts";
export * from "./xai-provider.ts";
export * from "./local-deterministic-provider.ts";

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
    this.providers.set("openai", new OpenAIProvider());
    this.providers.set("anthropic", new AnthropicProvider());
    this.providers.set("xai", new XAIProvider());
  }

  getProvider(preferredId?: string): AIProvider {
    if (preferredId && this.providers.has(preferredId)) {
      const p = this.providers.get(preferredId)!;
      if (p.isConfigured) return p;
    }

    const priority = ["openai", "gemini", "anthropic", "xai"];
    for (const id of priority) {
      const p = this.providers.get(id);
      if (p && p.isConfigured) return p;
    }

    throw new Error("No external AI provider is configured for this deployment.");
  }

  listProviderStatuses(): ProviderStatus[] {
    return [
      {
        id: "gemini",
        name: "Google Gemini 2.0 Flash / Pro",
        isConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
        supportedModels: ["gemini-2.0-flash", "gemini-2.5-pro"],
        requiredEnvVar: "GEMINI_API_KEY",
      },
      {
        id: "anthropic",
        name: "Anthropic Claude 3.7 Sonnet",
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
        name: "xAI Grok 2",
        isConfigured: Boolean(process.env.XAI_API_KEY),
        supportedModels: ["grok-2", "grok-3"],
        requiredEnvVar: "XAI_API_KEY",
      },
    ];
  }

  async executeWithFallback(request: ChatRequest, preferredId?: string): Promise<ChatResponse> {
    const p = this.getProvider(preferredId);
    return await p.chat(request);
  }
}
