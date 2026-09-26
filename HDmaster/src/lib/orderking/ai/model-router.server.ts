import { OpenAIProvider } from "./providers/openai-provider.ts";
import { GoogleGeminiProvider } from "./providers/gemini-provider.ts";
import { AnthropicProvider } from "./providers/anthropic-provider.ts";
import { XAIProvider } from "./providers/xai-provider.ts";
import type { ChatRequest, ChatResponse, AIProvider, ToolDefinition } from "./providers/provider-interface.ts";

export type AiProviderType = "openai" | "gemini" | "anthropic" | "xai" | "none";

/**
 * Production truth rule:
 * Only externally configured providers are reported as available.
 * No local/deterministic implementation is advertised as a live model.
 */
export function detectAvailableProviders(): { provider: AiProviderType; ready: boolean }[] {
  const available: { provider: AiProviderType; ready: boolean }[] = [];
  if (process.env.OPENAI_API_KEY) available.push({ provider: "openai", ready: true });
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) available.push({ provider: "gemini", ready: true });
  if (process.env.ANTHROPIC_API_KEY) available.push({ provider: "anthropic", ready: true });
  if (process.env.XAI_API_KEY) available.push({ provider: "xai", ready: true });
  return available;
}

export function selectActiveProvider(preferred?: string): { provider: AiProviderType; instance: AIProvider | null } {
  const available = detectAvailableProviders();
  if (available.length === 0) return { provider: "none", instance: null };

  const target = preferred && available.some((a) => a.provider === preferred)
    ? preferred
    : available[0].provider;

  switch (target) {
    case "openai": return { provider: target, instance: new OpenAIProvider() };
    case "gemini": return { provider: target, instance: new GoogleGeminiProvider() };
    case "anthropic": return { provider: target, instance: new AnthropicProvider() };
    case "xai": return { provider: target, instance: new XAIProvider() };
    default: return { provider: "none", instance: null };
  }
}

export async function routeModelTurn(request: ChatRequest, preferredProvider?: AiProviderType): Promise<ChatResponse> {
  const { instance } = selectActiveProvider(preferredProvider);
  if (!instance) throw new Error("No external AI provider is configured. System halted.");
  return await instance.chat(request);
}

export async function runCognitiveConsensus(request: ChatRequest): Promise<ChatResponse> {
  const available = detectAvailableProviders().map((a) => a.provider);
  if (available.length === 0) throw new Error("No external AI providers configured. Consensus impossible.");

  const responses = await Promise.allSettled(
    available.map(async (providerId) => {
      const { instance } = selectActiveProvider(providerId);
      if (!instance) throw new Error("Provider initialization failed");
      return await instance.chat(request);
    })
  );

  const successful = responses
    .filter((r): r is PromiseFulfilledResult<ChatResponse> => r.status === "fulfilled")
    .map((r) => r.value);

  if (successful.length === 0) throw new Error("All configured AI providers failed during cognitive consensus.");
  if (successful.length === 1) return successful[0];

  const synthesisRequest: ChatRequest = {
    model: "best-available",
    systemPrompt: "Synthesize the supplied provider findings into one evidence-grounded conclusion. Do not invent facts or claim capabilities not evidenced by the inputs.",
    messages: [{
      role: "user",
      content: `Synthesize these analytical responses into one coherent truth:\n\n${successful.map((r) => `[${r.provider}]: ${r.text}`).join("\n\n")}`,
    }],
  };

  const { instance: synthesizer } = selectActiveProvider();
  if (!synthesizer) throw new Error("No configured provider available for consensus synthesis.");
  return await synthesizer.chat(synthesisRequest);
}

export type ModelCallRequest = ChatRequest & { preferredProvider?: string; tools?: ToolDefinition[] };
export type ModelCallResponse = ChatResponse;
export type ModelMessage = ChatRequest["messages"][0];
export type ModelToolDefinition = ToolDefinition;
