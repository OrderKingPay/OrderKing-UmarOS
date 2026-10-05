// @ts-nocheck
// Umar OS: provider-truth model registry.
// Provider credentials are server-side only; no browser persistence or synthetic
// latency/model/benchmark claims are permitted.

export interface VerifiedModelRecord {
  id: string;
  displayName: string;
  provider: "Local Sovereign" | "Google" | "Anthropic" | "OpenAI" | "xAI" | "Orchestrator" | "Consensus";
  realApiId: string;
  connectionStatus: "CONNECTED" | "CONFIGURATION_REQUIRED" | "UNAVAILABLE";
  authStatus: "VERIFIED" | "MISSING_KEY" | "LOCAL_CORE";
  requiredEnvVar?: string;
  supportedModalities: ("text" | "vision" | "voice" | "code" | "file")[];
  contextWindow: string;
  supportsTools: boolean;
  supportsReasoning: boolean;
  supportsWebSearch: boolean;
  measuredLatencyMs: number;
  lastChecked: string;
  fallbackModelId: string;
  description: string;
  capabilities: {
    canStream: boolean;
    canProcessImages: boolean;
    canProcessFiles: boolean;
    canUseTools: boolean;
  };
}

export interface ModelConnectionTestResult {
  modelId: string;
  success: boolean;
  status: "CONNECTED" | "CONFIGURATION_REQUIRED" | "ERROR";
  latencyMs: number;
  realModelUsed: string;
  message: string;
  timestamp: string;
}

export function getProviderApiKey(provider: string): string | undefined {
  const envMap: Record<string, string | undefined> = {
    openai: typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : undefined,
    anthropic: typeof process !== "undefined" ? process.env?.ANTHROPIC_API_KEY : undefined,
    gemini: typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY || process.env?.GOOGLE_API_KEY) : undefined,
    xai: typeof process !== "undefined" ? process.env?.XAI_API_KEY : undefined,
  };
  return envMap[provider.toLowerCase()]?.trim() || undefined;
}

export function setProviderApiKey(_provider: string, _apiKey: string): never {
  throw new Error("Provider API keys must be configured through the server-side secret manager; browser persistence is disabled.");
}

export function getVerifiedModelRegistry(): VerifiedModelRecord[] {
  const geminiKey = getProviderApiKey("gemini");
  const anthropicKey = getProviderApiKey("anthropic");
  const openaiKey = getProviderApiKey("openai");
  const xaiKey = getProviderApiKey("xai");
  const now = new Date().toISOString();

  return [
    {
      id: "sovereign-ultra",
      displayName: "Umar Local Engine (Not Bundled)",
      provider: "Local Sovereign",
      realApiId: "NO_EMBEDDED_LLM",
      connectionStatus: "UNAVAILABLE",
      authStatus: "LOCAL_CORE",
      supportedModalities: ["text", "code", "file"],
      contextWindow: "NOT_MEASURED",
      supportsTools: false,
      supportsReasoning: false,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Future local capability placeholder. This deployment does not contain an embedded local LLM.",
      capabilities: { canStream: false, canProcessImages: false, canProcessFiles: false, canUseTools: false },
    },
    {
      id: "auto-supreme-orchestrator",
      displayName: "Auto-Select Configured Provider",
      provider: "Orchestrator",
      realApiId: "DYNAMIC_PROVIDER_ROUTER",
      connectionStatus: (openaiKey || geminiKey || anthropicKey || xaiKey) ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      authStatus: (openaiKey || geminiKey || anthropicKey || xaiKey) ? "VERIFIED" : "MISSING_KEY",
      supportedModalities: ["text", "vision", "voice", "code", "file"],
      contextWindow: "PROVIDER_SELECTED",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Routes only to genuinely configured external providers. No local synthetic fallback is claimed.",
      capabilities: { canStream: true, canProcessImages: true, canProcessFiles: true, canUseTools: true },
    },
    {
      id: "ensemble-consensus",
      displayName: "Multi-Provider Consensus",
      provider: "Consensus",
      realApiId: "MULTI_PROVIDER_CONSENSUS",
      connectionStatus: (openaiKey || geminiKey || anthropicKey || xaiKey) ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      authStatus: (openaiKey || geminiKey || anthropicKey || xaiKey) ? "VERIFIED" : "MISSING_KEY",
      supportedModalities: ["text", "code", "file"],
      contextWindow: "PROVIDER_AGGREGATED",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Counts only providers that actually execute successfully. It does not certify truthfulness automatically.",
      capabilities: { canStream: true, canProcessImages: false, canProcessFiles: true, canUseTools: true },
    },
    {
      id: "gemini-configured",
      displayName: "Google — provider-configured model",
      provider: "Google",
      realApiId: "PROVIDER_SELECTED_MODEL",
      connectionStatus: geminiKey ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      authStatus: geminiKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "GEMINI_API_KEY",
      supportedModalities: ["text", "vision", "voice", "file"],
      contextWindow: "PROVIDER_REPORTED",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Model identity, capability and latency come from the real configured Google provider.",
      capabilities: { canStream: true, canProcessImages: true, canProcessFiles: true, canUseTools: true },
    },
    {
      id: "anthropic-configured",
      displayName: "Anthropic — provider-configured model",
      provider: "Anthropic",
      realApiId: "PROVIDER_SELECTED_MODEL",
      connectionStatus: anthropicKey ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      authStatus: anthropicKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "ANTHROPIC_API_KEY",
      supportedModalities: ["text", "vision", "code", "file"],
      contextWindow: "PROVIDER_REPORTED",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Model identity and latency come from the real configured Anthropic provider.",
      capabilities: { canStream: true, canProcessImages: true, canProcessFiles: true, canUseTools: true },
    },
    {
      id: "openai-configured",
      displayName: "OpenAI — provider-configured model",
      provider: "OpenAI",
      realApiId: "PROVIDER_SELECTED_MODEL",
      connectionStatus: openaiKey ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      authStatus: openaiKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "OPENAI_API_KEY",
      supportedModalities: ["text", "vision", "code", "file"],
      contextWindow: "PROVIDER_REPORTED",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Model identity and latency come from the real configured OpenAI provider.",
      capabilities: { canStream: true, canProcessImages: true, canProcessFiles: true, canUseTools: true },
    },
    {
      id: "xai-configured",
      displayName: "xAI — provider-configured model",
      provider: "xAI",
      realApiId: "PROVIDER_SELECTED_MODEL",
      connectionStatus: xaiKey ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      authStatus: xaiKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "XAI_API_KEY",
      supportedModalities: ["text", "code", "file"],
      contextWindow: "PROVIDER_REPORTED",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "NONE",
      description: "Model identity and latency come from the real configured xAI provider.",
      capabilities: { canStream: true, canProcessImages: false, canProcessFiles: true, canUseTools: true },
    },
  ];
}

export async function testModelConnectivity(modelId: string): Promise<ModelConnectionTestResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const registry = getVerifiedModelRegistry();
  const target = registry.find((m) => m.id === modelId) || registry[0];

  if (target.provider === "Local Sovereign") {
    return {
      modelId: target.id,
      success: false,
      status: "CONFIGURATION_REQUIRED",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: "No embedded local LLM is bundled with this deployment.",
      timestamp,
    };
  }

  if (target.id === "auto-supreme-orchestrator" || target.id === "ensemble-consensus") {
    const ready = Boolean(getProviderApiKey("openai") || getProviderApiKey("gemini") || getProviderApiKey("anthropic") || getProviderApiKey("xai"));
    return {
      modelId: target.id,
      success: ready,
      status: ready ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: ready ? "At least one real provider is configured; no model-specific inference was executed." : "No real external provider is configured.",
      timestamp,
    };
  }

  const providerKey = target.provider.toLowerCase();
  const apiKey = getProviderApiKey(providerKey);
  if (!apiKey) {
    return {
      modelId: target.id,
      success: false,
      status: "CONFIGURATION_REQUIRED",
      latencyMs: 0,
      realModelUsed: target.realApiId,
      message: `Configuration Required: ${target.requiredEnvVar} is not configured.`,
      timestamp,
    };
  }

  try {
    let endpoint = "";
    if (target.provider === "OpenAI") endpoint = "https://api.openai.com/v1/models";
    else if (target.provider === "Anthropic") endpoint = "https://api.anthropic.com/v1/models";
    else if (target.provider === "Google") endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    else if (target.provider === "xAI") endpoint = "https://api.x.ai/v1/models";
    else throw new Error("Unsupported provider");

    const headers: Record<string, string> = { Accept: "application/json" };
    if (target.provider === "OpenAI" || target.provider === "xAI") {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    if (target.provider === "Anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    }

    const response = await fetch(endpoint, { method: "GET", headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return {
      modelId: target.id,
      success: true,
      status: "CONNECTED",
      latencyMs: Date.now() - start,
      realModelUsed: "PROVIDER_MODELS_ENDPOINT_VERIFIED",
      message: `Verified provider connectivity to ${target.provider}; exact model selection remains provider-configured.`,
      timestamp,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      modelId: target.id,
      success: false,
      status: "ERROR",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: `Connection test failed: ${message.slice(0, 160)}`,
      timestamp,
    };
  }
}
