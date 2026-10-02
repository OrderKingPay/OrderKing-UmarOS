// Customer AI model registry.
// Truth rule: credentials are server-only, and a key alone never proves model availability.

export interface VerifiedModelRecord {
  id: string;
  displayName: string;
  provider: "OpenAI" | "Orchestrator";
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

const OPENAI_MODELS = [
  { id: "gpt-5-6-sol", apiId: "gpt-5.6-sol", label: "OpenAI GPT-5.6 Sol" },
  { id: "gpt-5-6-luna", apiId: "gpt-5.6-luna", label: "OpenAI GPT-5.6 Luna" },
] as const;

export function getProviderApiKey(provider: string): string | undefined {
  if (provider.toLowerCase() !== "openai") return undefined;
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function setProviderApiKey(_provider: string, _apiKey: string): void {
  throw new Error("Provider API keys must be configured server-side; browser key storage is disabled.");
}

function openAiRecord(model: typeof OPENAI_MODELS[number], keyPresent: boolean, now: string): VerifiedModelRecord {
  return {
    id: model.id,
    displayName: model.label,
    provider: "OpenAI",
    realApiId: model.apiId,
    connectionStatus: keyPresent ? "UNVERIFIED" : "CONFIGURATION_REQUIRED",
    authStatus: keyPresent ? "VERIFIED" : "MISSING_KEY",
    requiredEnvVar: "OPENAI_API_KEY",
    supportedModalities: ["text", "vision", "code", "file"],
    contextWindow: "Provider-discovered",
    supportsTools: false,
    supportsReasoning: true,
    supportsWebSearch: false,
    measuredLatencyMs: 0,
    lastChecked: now,
    fallbackModelId: OPENAI_MODELS[1].id,
    description: "Real OpenAI model. CONNECTED is reported only after a provider-side availability check succeeds.",
    capabilities: {
      canStream: true,
      canProcessImages: true,
      canProcessFiles: true,
      canUseTools: false,
    },
  };
}

export function getVerifiedModelRegistry(): VerifiedModelRecord[] {
  const keyPresent = Boolean(getProviderApiKey("openai"));
  const now = new Date().toISOString();

  return [
    openAiRecord(OPENAI_MODELS[0], keyPresent, now),
    openAiRecord(OPENAI_MODELS[1], keyPresent, now),
    {
      id: "auto-supreme-orchestrator",
      displayName: "OpenAI Auto Routing",
      provider: "Orchestrator",
      realApiId: "runtime-selected-openai-model",
      connectionStatus: keyPresent ? "UNVERIFIED" : "CONFIGURATION_REQUIRED",
      authStatus: keyPresent ? "VERIFIED" : "MISSING_KEY",
      requiredEnvVar: "OPENAI_API_KEY",
      supportedModalities: ["text", "vision", "code", "file"],
      contextWindow: "Depends on selected OpenAI model",
      supportsTools: false,
      supportsReasoning: true,
      supportsWebSearch: false,
      measuredLatencyMs: 0,
      lastChecked: now,
      fallbackModelId: OPENAI_MODELS[1].id,
      description: "Selects an OpenAI model that the server has actually verified for this API key.",
      capabilities: {
        canStream: true,
        canProcessImages: true,
        canProcessFiles: true,
        canUseTools: false,
      },
    },
  ];
}

export async function testModelConnectivity(modelId: string): Promise<ModelConnectionTestResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const registry = getVerifiedModelRegistry();
  const target = registry.find((m) => m.id === modelId) ?? registry[0];

  if (!target) {
    return {
      modelId,
      success: false,
      status: "ERROR",
      latencyMs: Date.now() - start,
      realModelUsed: modelId,
      message: "No customer AI model is registered.",
      timestamp,
    };
  }

  const apiKey = getProviderApiKey("openai");
  if (!apiKey) {
    return {
      modelId: target.id,
      success: false,
      status: "CONFIGURATION_REQUIRED",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: "Configuration Required: OPENAI_API_KEY is not configured on the server.",
      timestamp,
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: \`Bearer \${apiKey}\` },
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}: OpenAI model listing failed\`);

    const body = (await res.json()) as { data?: Array<{ id?: string }> };
    const available = new Set((body.data ?? []).map((m) => m.id).filter(Boolean));
    const requested = target.provider === "Orchestrator"
      ? OPENAI_MODELS.map((m) => m.apiId).find((id) => available.has(id))
      : target.realApiId;

    if (!requested || !available.has(requested)) {
      throw new Error(\`OpenAI model \${requested ?? target.realApiId} is not available to this API key.\`);
    }

    return {
      modelId: target.id,
      success: true,
      status: "CONNECTED",
      latencyMs: Date.now() - start,
      realModelUsed: requested,
      message: \`Verified OpenAI model availability: \${requested}.\`,
      timestamp,
    };
  } catch (err: unknown) {
    return {
      modelId: target.id,
      success: false,
      status: "ERROR",
      latencyMs: Date.now() - start,
      realModelUsed: target.realApiId,
      message: \`Connection test failed: \${err instanceof Error ? err.message : String(err)}\`,
      timestamp,
    };
  }
}
