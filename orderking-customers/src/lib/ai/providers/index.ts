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

    // External-provider-only hierarchy. Local deterministic code is not presented as a language-model fallback.
    const priority = ["openai", "anthropic", "gemini", "xai"];
    for (const id of priority) {
      const p = this.providers.get(id);
      if (p && p.isConfigured) return p;
    }

    throw new Error("No external AI provider is configured. Configure OpenAI, Anthropic, Gemini, or xAI before using AI chat.");
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
        name: "OpenAI GPT-5.6 Luna / GPT-5.6 Sol",
        isConfigured: Boolean(process.env.OPENAI_API_KEY),
        supportedModels: ["gpt-5.6-luna", "gpt-5.6-sol"],
        requiredEnvVar: "OPENAI_API_KEY",
      },
      {
        id: "xai",
        name: "xAI Grok 2",
        isConfigured: Boolean(process.env.XAI_API_KEY),
        supportedModels: ["grok-2", "grok-3"],
        requiredEnvVar: "XAI_API_KEY",
      },
      {
        id: "local_deterministic",
        name: "Local Sovereign Engine (Zero-Dep)",
        isConfigured: true,
        supportedModels: ["sovereign-ultra-deterministic"],
        requiredEnvVar: "NONE (Always Active)",
      },
    ];
  }

  async executeWithFallback(request: ChatRequest, preferredId?: string): Promise<ChatResponse> {
    const p = this.getProvider(preferredId);
    try {
      return await p.chat(request);
    } catch (err) {
      console.warn(`Provider ${p.id} failed; trying remaining external providers:`, err);
      const priority = ["openai", "anthropic", "gemini", "xai"];
      for (const id of priority) {
        if (id === p.id) continue;
        const candidate = this.providers.get(id);
        if (!candidate?.isConfigured) continue;
        try { return await candidate.chat(request); } catch (candidateError) { console.warn(`Provider ${id} failed:`, candidateError); }
      }
      throw new Error("All configured external AI providers failed. No simulated/local AI response is permitted.");
    }
  }
}
