import { OpenAIProvider } from "./providers/openai-provider.ts";
import { GoogleGeminiProvider } from "./providers/gemini-provider.ts";
import { AnthropicProvider } from "./providers/anthropic-provider.ts";
import { XAIProvider } from "./providers/xai-provider.ts";
import type { ChatRequest, ChatResponse, AIProvider, ToolDefinition } from "./providers/provider-interface.ts";

export type AiProviderType = "openai" | "gemini" | "anthropic" | "xai" | "none";

export function detectAvailableProviders(): AiProviderType[] {
  const available: AiProviderType[] = [];
  if (process.env.OPENAI_API_KEY) available.push("openai");
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) available.push("gemini");
  if (process.env.ANTHROPIC_API_KEY) available.push("anthropic");
  if (process.env.XAI_API_KEY) available.push("xai");
  return available;
}

export function selectActiveProvider(preferred?: string): { provider: AiProviderType; instance: AIProvider | null } {
  const available = detectAvailableProviders();
  if (available.length === 0) {
    return { provider: "none", instance: null };
  }
  
  const target = (preferred && available.includes(preferred as AiProviderType)) ? preferred : available[0];

  let instance: AIProvider | null = null;
  switch (target) {
    case "openai": instance = new OpenAIProvider(); break;
    case "gemini": instance = new GoogleGeminiProvider(); break;
    case "anthropic": instance = new AnthropicProvider(); break;
    case "xai": instance = new XAIProvider(); break;
  }

  return { provider: target as AiProviderType, instance };
}

export async function routeModelTurn(request: ChatRequest, preferredProvider?: AiProviderType): Promise<ChatResponse> {
  const { provider, instance } = selectActiveProvider(preferredProvider);
  if (!instance) {
    throw new Error("No AI providers configured. System halted.");
  }
  
  return await instance.chat(request);
}

export async function runCognitiveConsensus(request: ChatRequest): Promise<ChatResponse> {
  // A genuine multi-provider evaluation using all available configured providers.
  const available = detectAvailableProviders();
  if (available.length === 0) {
    throw new Error("No AI providers configured. Consensus impossible.");
  }

  const responses = await Promise.allSettled(
    available.map(async (providerId) => {
      const { instance } = selectActiveProvider(providerId);
      if (!instance) throw new Error("Initialization failed");
      return await instance.chat(request);
    })
  );

  const successful = responses
    .filter((r): r is PromiseFulfilledResult<ChatResponse> => r.status === "fulfilled")
    .map(r => r.value);

  if (successful.length === 0) {
    throw new Error("All AI providers failed during cognitive consensus.");
  }

  // Synthesize using the best available provider
  if (successful.length === 1) return successful[0];

  const synthesisRequest: ChatRequest = {
    model: "best-available", // The provider will default to its best model
    systemPrompt: "You are the Supreme Architect synthesizing multiple AI findings into a final authoritative conclusion.",
    messages: [
      {
        role: "user",
        content: `Synthesize these analytical responses into one coherent truth:\n\n${successful.map(r => `[${r.provider}]: ${r.text}`).join("\n\n")}`
      }
    ]
  };

  const { instance: synthesizer } = selectActiveProvider();
  return await synthesizer!.chat(synthesisRequest);
}

// Ensure compatibility types for legacy consumers
export type ModelCallRequest = ChatRequest & { preferredProvider?: string, tools?: ToolDefinition[] };
export type ModelCallResponse = ChatResponse;
export type ModelMessage = ChatRequest["messages"][0];
export type ModelToolDefinition = ToolDefinition;
