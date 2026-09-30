
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
        name: "Google Gemini",
        isConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
        supportedModels: process.env.GEMINI_MODEL?.trim() ? [process.env.GEMINI_MODEL.trim()] : [],
        requiredEnvVar: "GEMINI_API_KEY",
      },
      {
        id: "anthropic",
        name: "Anthropic Claude",
        isConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        supportedModels: process.env.ANTHROPIC_MODEL?.trim() ? [process.env.ANTHROPIC_MODEL.trim()] : [],
        requiredEnvVar: "ANTHROPIC_API_KEY",
      },
      {
        id: "openai",
        name: "OpenAI",
        isConfigured: Boolean(process.env.OPENAI_API_KEY),
        supportedModels: process.env.OPENAI_MODEL?.trim() ? [process.env.OPENAI_MODEL.trim()] : [],
        requiredEnvVar: "OPENAI_API_KEY",
      },
      {
        id: "xai",
        name: "xAI Grok",
        isConfigured: Boolean(process.env.XAI_API_KEY),
        supportedModels: process.env.XAI_MODEL?.trim() ? [process.env.XAI_MODEL.trim()] : [],
        requiredEnvVar: "XAI_API_KEY",
      }
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
