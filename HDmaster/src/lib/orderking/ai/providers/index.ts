// @ts-nocheck
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

    // Auto-fallback hierarchy
    const priority = ["gemini", "anthropic", "openai", "xai"];
    for (const id of priority) {
      const p = this.providers.get(id);
      if (p && p.isConfigured) return p;
    }

    throw new Error("BLOCKED: No real AI provider API keys are configured in the environment.");
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
    return await p.chat(request);
  }
}

export const modelRouter = new ModelRouterService();
