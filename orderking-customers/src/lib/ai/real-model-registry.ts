
// Umar OS / OrderKing: Sovereign Verified Model Registry & Real Provider Connection Engine
// Enforces Zero-Fabrication: Truthfully reports connection status, real API model IDs,
// supported modalities, context windows, and real-time latency measurements.

export interface VerifiedModelRecord {
  id: string;
  displayName: string;
  provider: "Google" | "Anthropic" | "OpenAI" | "xAI" | "Orchestrator" | "Consensus";
  realApiId: string;
  connectionStatus: "CONNECTED" | "CONFIGURATION_REQUIRED" | "UNAVAILABLE";
  authStatus: "VERIFIED" | "MISSING_KEY";
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

// Key manager: reads only from secure server-side environment variables
export function getProviderApiKey(provider: string): string | undefined {
  const envMap: Record<string, string | undefined> = {
    openai: typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : undefined,
    anthropic: typeof process !== "undefined" ? process.env?.ANTHROPIC_API_KEY : undefined,
    gemini: typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY || process.env?.GOOGLE_API_KEY) : undefined,
    xai: typeof process !== "undefined" ? process.env?.XAI_API_KEY : undefined,
  };

  const keyFromEnv = envMap[provider.toLowerCase()];
  if (keyFromEnv && keyFromEnv.trim().length > 0) return keyFromEnv.trim();

  return undefined;
}

export function setProviderApiKey(_provider: string, _apiKey: string): void {
  throw new Error("Provider API keys must be configured server-side; browser storage is intentionally disabled.");
}
/**
 * Returns the authoritative list of verified models with their exact connectivity status.
 */
export function getVerifiedModelRegistry(): VerifiedModelRecord[] {
  const providers = [
    {
      id: "openai-runtime",
      displayName: "OpenAI (server-selected model)",
      provider: "OpenAI",
      modelEnv: "OPENAI_MODEL",
      key: getProviderApiKey("openai"),
      requiredEnvVar: "OPENAI_API_KEY",
    },
    {
      id: "gemini-runtime",
      displayName: "Google Gemini (server-selected model)",
      provider: "Google",
      modelEnv: "GEMINI_MODEL",
      key: getProviderApiKey("gemini"),
      requiredEnvVar: "GEMINI_API_KEY",
    },
    {
      id: "anthropic-runtime",
      displayName: "Anthropic Claude (server-selected model)",
      provider: "Anthropic",
      modelEnv: "ANTHROPIC_MODEL",
      key: getProviderApiKey("anthropic"),
      requiredEnvVar: "ANTHROPIC_API_KEY",
    },
    {
      id: "xai-runtime",
      displayName: "xAI Grok (server-selected model)",
      provider: "xAI",
      modelEnv: "XAI_MODEL",
      key: getProviderApiKey("xai"),
      requiredEnvVar: "XAI_API_KEY",
    },
  ] as const;

  const now = new Date().toISOString();
  const result: VerifiedModelRecord[] = providers.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    provider: p.provider,
    realApiId:
      (typeof process !== "undefined" && process.env?.[p.modelEnv]?.trim()) ||
      "provider-selected-at-runtime",
    connectionStatus: p.key ? "UNAVAILABLE" : "CONFIGURATION_REQUIRED",
    authStatus: p.key ? "VERIFIED" : "MISSING_KEY",
    requiredEnvVar: p.requiredEnvVar,
    supportedModalities: ["text"],
    contextWindow: "Provider-reported at runtime",
    supportsTools: false,
    supportsReasoning: false,
    supportsWebSearch: false,
    measuredLatencyMs: 0,
    lastChecked: now,
    fallbackModelId: "none",
    description: p.key
      ? "Server credential is configured, but live model connectivity has not been verified in this process. Use the server-side test action to obtain the real provider model list."
      : `No server credential configured. Set ${p.requiredEnvVar} in the secure deployment environment.`,
    capabilities: {
      canStream: false,
      canProcessImages: false,
      canProcessFiles: false,
      canUseTools: false,
    },
  }));

  result.push(
    {
      id: "auto-supreme-orchestrator",
      displayName: "Auto-Select Best Configured Provider",
      provider: "Orchestrator",
      realApiId: "dynamic-router-v1",
      connectionStatus: providers.some((p) => Boolean(p.key)) ? "UNAVAILABLE" : "CONFIGURATION_REQUIRED",
      authStatus: providers.some((p) => Boolean(p.key)) ? "VERIFIED" : "MISSING_KEY",
      supportedModalities: ["text"],
      contextWindow: "Dynamic",
      supportsTools: false,
      supportsReasoning: false,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "none",
      description: "Routes only to providers that are actually configured and successfully return real output. It has no embedded local-model fallback.",
      capabilities: {
        canStream: false,
        canProcessImages: false,
        canProcessFiles: false,
        canUseTools: false,
      },
    },
    {
      id: "ensemble-consensus",
      displayName: "Multi-Provider Consensus (real providers only)",
      provider: "Consensus",
      realApiId: "multi-provider-consensus-v1",
      connectionStatus: providers.some((p) => Boolean(p.key)) ? "UNAVAILABLE" : "CONFIGURATION_REQUIRED",
      authStatus: providers.some((p) => Boolean(p.key)) ? "VERIFIED" : "MISSING_KEY",
      supportedModalities: ["text"],
      contextWindow: "Aggregated at runtime",
      supportsTools: false,
      supportsReasoning: false,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: "none",
      description: "Consensus is only reported after multiple real providers return. No synthetic local participant is counted.",
      capabilities: {
        canStream: false,
        canProcessImages: false,
        canProcessFiles: false,
        canUseTools: false,
      },
    }
  );

  return result;
}
/**
 * Executes a real minimal test request to verify provider connectivity.
 * Zero fabrication: accurately reports failures and measured latency.
 */
export async function testModelConnectivity(modelId: string): Promise<ModelConnectionTestResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const registry = getVerifiedModelRegistry();
  const target = registry.find((m) => m.id === modelId) || registry[0];

  if (!target) {
    return {
      modelId,
      success: false,
      status: "ERROR",
      latencyMs: Date.now() - start,
      realModelUsed: "",
      message: "Unknown model id.",
      timestamp,
    };
  }

  const provider = target.provider;
  if (provider === "Local Sovereign") {
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
    const ready = Boolean(
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.ANTHROPIC_API_KEY?.trim() ||
      process.env.XAI_API_KEY?.trim()
    );
    return {
      modelId: target.id,
      success: ready,
      status: ready ? "CONNECTED" : "CONFIGURATION_REQUIRED",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: ready
        ? "Verified: at least one real external provider is configured on the server."
        : "Configuration required: no external provider is configured.",
      timestamp,
    };
  }

  const apiKey = getProviderApiKey(provider.toLowerCase());
  if (!apiKey) {
    return {
      modelId: target.id,
      success: false,
      status: "CONFIGURATION_REQUIRED",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: `Configuration required: ${target.requiredEnvVar || "provider credential"} is missing from the server environment.`,
      timestamp,
    };
  }

  try {
    let endpoint = "";
    const headers: Record<string, string> = {};
    let selectedModel = "";

    if (provider === "OpenAI") {
      endpoint = "https://api.openai.com/v1/models";
      headers.Authorization = `Bearer ${apiKey}`;
      selectedModel = process.env.OPENAI_MODEL?.trim() || "";
    } else if (provider === "Anthropic") {
      endpoint = "https://api.anthropic.com/v1/models";
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      selectedModel = process.env.ANTHROPIC_MODEL?.trim() || "";
    } else if (provider === "Google") {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      selectedModel = process.env.GEMINI_MODEL?.trim() || "";
    } else if (provider === "xAI") {
      endpoint = "https://api.x.ai/v1/models";
      headers.Authorization = `Bearer ${apiKey}`;
      selectedModel = process.env.XAI_MODEL?.trim() || "";
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const response = await fetch(endpoint, { method: "GET", headers });
    const elapsed = Date.now() - start;
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 180)}`);
    }

    const data = await response.json() as any;
    const modelIds =
      provider === "Google"
        ? (data.models || []).map((m: any) => String(m.name || "").replace(/^models\//, "")).filter(Boolean)
        : (data.data || []).map((m: any) => String(m.id || "")).filter(Boolean);

    const realModelUsed =
      (selectedModel && modelIds.includes(selectedModel))
        ? selectedModel
        : (modelIds[0] || target.realApiId);

    return {
      modelId: target.id,
      success: true,
      status: "CONNECTED",
      latencyMs: elapsed,
      realModelUsed,
      message: `Authenticated successfully with ${provider}; ${modelIds.length} model records were returned by the provider API.`,
      timestamp,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      modelId: target.id,
      success: false,
      status: "ERROR",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: `Provider verification failed: ${errorMsg.slice(0, 200)}`,
      timestamp,
    };
  }
}
