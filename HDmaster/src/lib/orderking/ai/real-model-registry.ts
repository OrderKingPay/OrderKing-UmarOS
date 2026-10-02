// Umar OS: verified provider/model registry.
// Truth rule: a configured credential is never presented as successful model connectivity.
// API keys are server-only; browser localStorage is deliberately unsupported.

export interface VerifiedModelRecord {
  id: string;
  displayName: string;
  provider: "Google" | "Anthropic" | "OpenAI" | "xAI" | "Orchestrator" | "Consensus";
  realApiId: string;
  connectionStatus: "CONNECTED" | "CONFIGURATION_REQUIRED" | "UNAVAILABLE" | "UNVERIFIED";
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

const OPENAI_MODELS = {
  sol: { id: "openai-gpt-5.6-sol", apiId: "gpt-5.6-sol", label: "OpenAI GPT-5.6 Sol", fallback: "openai-gpt-5.6-luna" },
  terra: { id: "openai-gpt-5.6-terra", apiId: "gpt-5.6-terra", label: "OpenAI GPT-5.6 Terra", fallback: "openai-gpt-5.6-luna" },
  luna: { id: "openai-gpt-5.6-luna", apiId: "gpt-5.6-luna", label: "OpenAI GPT-5.6 Luna", fallback: "openai-gpt-5.6-luna" },
} as const;

export function getProviderApiKey(provider: string): string | undefined {
  const envMap: Record<string, string | undefined> = {
    openai: typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : undefined,
    anthropic: typeof process !== "undefined" ? process.env?.ANTHROPIC_API_KEY : undefined,
    gemini: typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY || process.env?.GOOGLE_API_KEY) : undefined,
    xai: typeof process !== "undefined" ? process.env?.XAI_API_KEY : undefined,
  };
  const key = envMap[provider.toLowerCase()];
  return key?.trim() || undefined;
}

export function setProviderApiKey(_provider: string, _apiKey: string): void {
  throw new Error("Provider API keys must be configured server-side; browser key storage is disabled.");
}

function openAiRecord(model: typeof OPENAI_MODELS[keyof typeof OPENAI_MODELS], keyPresent: boolean, now: string): VerifiedModelRecord {
  return {
    id: model.id,
    displayName: model.label,
    provider: "OpenAI",
    realApiId: model.apiId,
    connectionStatus: keyPresent ? "UNVERIFIED" : "CONFIGURATION_REQUIRED",
    authStatus: keyPresent ? "VERIFIED" : "MISSING_KEY",
    requiredEnvVar: "OPENAI_API_KEY",
    supportedModalities: ["text", "vision", "code", "file"],
    contextWindow: "1.05M tokens",
    supportsTools: true,
    supportsReasoning: true,
    supportsWebSearch: true,
    measuredLatencyMs: 0,
    lastChecked: now,
    fallbackModelId: model.fallback,
    description: "Real OpenAI model. This record becomes CONNECTED only after a live provider availability check succeeds.",
    capabilities: {
      canStream: true,
      canProcessImages: true,
      canProcessFiles: true,
      canUseTools: true,
    },
  };
}

export function getVerifiedModelRegistry(): VerifiedModelRecord[] {
  const openaiKey = getProviderApiKey("openai");
  const geminiKey = getProviderApiKey("gemini");
  const anthropicKey = getProviderApiKey("anthropic");
  const xaiKey = getProviderApiKey("xai");
  const now = new Date().toISOString();

  const providerState = (key: string | undefined) => key ? "UNVERIFIED" as const : "CONFIGURATION_REQUIRED" as const;

  return [
    openAiRecord(OPENAI_MODELS.sol, Boolean(openaiKey), now),
    openAiRecord(OPENAI_MODELS.terra, Boolean(openaiKey), now),
    openAiRecord(OPENAI_MODELS.luna, Boolean(openaiKey), now),
    {
      id: "auto-openai-routing",
      displayName: "OpenAI Auto Routing",
      provider: "Orchestrator",
      realApiId: "runtime-selected-openai-model",
      connectionStatus: openaiKey ? "UNVERIFIED" : "CONFIGURATION_REQUIRED",
      authStatus: openaiKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "OPENAI_API_KEY",
      supportedModalities: ["text", "vision", "code", "file"],
      contextWindow: "Depends on selected model",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: OPENAI_MODELS.luna.id,
      description: "Selects from models actually exposed to this API key; it never assumes access from a configured key.",
      capabilities: {
        canStream: true,
        canProcessImages: true,
        canProcessFiles: true,
        canUseTools: true,
      },
    },
    {
      id: "google-provider",
      displayName: "Google provider",
      provider: "Google",
      realApiId: "runtime-discovered",
      connectionStatus: providerState(geminiKey),
      authStatus: geminiKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "GEMINI_API_KEY",
      supportedModalities: ["text", "vision", "voice", "file"],
      contextWindow: "Provider-discovered",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: OPENAI_MODELS.luna.id,
      description: "Provider configured status only; exact model access must be discovered from the provider at runtime.",
      capabilities: {
        canStream: true,
        canProcessImages: true,
        canProcessFiles: true,
        canUseTools: true,
      },
    },
    {
      id: "anthropic-provider",
      displayName: "Anthropic provider",
      provider: "Anthropic",
      realApiId: "runtime-discovered",
      connectionStatus: providerState(anthropicKey),
      authStatus: anthropicKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "ANTHROPIC_API_KEY",
      supportedModalities: ["text", "vision", "code", "file"],
      contextWindow: "Provider-discovered",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: OPENAI_MODELS.luna.id,
      description: "Provider configured status only; exact model access must be discovered from the provider at runtime.",
      capabilities: {
        canStream: true,
        canProcessImages: true,
        canProcessFiles: true,
        canUseTools: true,
      },
    },
    {
      id: "xai-provider",
      displayName: "xAI provider",
      provider: "xAI",
      realApiId: "runtime-discovered",
      connectionStatus: providerState(xaiKey),
      authStatus: xaiKey ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "XAI_API_KEY",
      supportedModalities: ["text", "code", "file"],
      contextWindow: "Provider-discovered",
      supportsTools: true,
      supportsReasoning: true,
      supportsWebSearch: true,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: OPENAI_MODELS.luna.id,
      description: "Provider configured status only; exact model access must be discovered from the provider at runtime.",
      capabilities: {
        canStream: true,
        canProcessImages: false,
        canProcessFiles: true,
        canUseTools: true,
      },
    },
  ];
}

async function listOpenAiModels(apiKey: string): Promise<string[]> {
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: OpenAI model listing failed`);
  const body = await res.json();
  return Array.isArray(body?.data) ? body.data.map((m: { id?: unknown }) => String(m?.id || "")).filter(Boolean) : [];
}

export async function selectAvailableOpenAiModel(
  preferredModelId = OPENAI_MODELS.luna.apiId,
): Promise<{ modelId: string; candidatesChecked: string[] }> {
  const apiKey = getProviderApiKey("openai");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const available = new Set(await listOpenAiModels(apiKey));
  const candidates = [preferredModelId, OPENAI_MODELS.luna.apiId, OPENAI_MODELS.terra.apiId, OPENAI_MODELS.sol.apiId]
    .filter((id, index, all) => all.indexOf(id) === index);
  const modelId = candidates.find((id) => available.has(id));
  if (!modelId) throw new Error("No configured OpenAI high-speed support model is available to this API key.");
  return { modelId, candidatesChecked: candidates };
}

export async function testModelConnectivity(modelId: string): Promise<ModelConnectionTestResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const target = getVerifiedModelRegistry().find((m) => m.id === modelId) || getVerifiedModelRegistry()[0];
  const providerKey = target.provider === "Orchestrator" ? "openai" : target.provider.toLowerCase();
  const apiKey = getProviderApiKey(providerKey);

  if (!apiKey) {
    return {
      modelId: target.id,
      success: false,
      status: "CONFIGURATION_REQUIRED",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: `Configuration Required: ${target.requiredEnvVar || "provider credential"} is not configured.`,
      timestamp,
    };
  }

  try {
    if (target.provider === "OpenAI" || target.provider === "Orchestrator") {
      const available = await listOpenAiModels(apiKey);
      const requested = target.provider === "Orchestrator" ? (await selectAvailableOpenAiModel()).modelId : target.realApiId;
      if (!available.includes(requested)) throw new Error(`Model ${requested} is not available to this API key.`);
      return {
        modelId: target.id,
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - start,
        realModelUsed: requested,
        message: `Verified OpenAI model availability for ${requested}.`,
        timestamp,
      };
    }

    return {
      modelId: target.id,
      success: false,
      status: "ERROR",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: "This provider requires runtime model discovery; no hard-coded model claim is made here.",
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
      message: `Connection test failed: ${errorMsg.slice(0, 160)}`,
      timestamp,
    };
  }
}
