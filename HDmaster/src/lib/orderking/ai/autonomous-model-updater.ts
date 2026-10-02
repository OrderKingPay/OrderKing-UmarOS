// Umar OS model registry.
// Truth rule: provider credentials alone do not prove model availability.
// Model IDs are only marked active after a provider-side availability check.
// No browser/localStorage API keys, fake benchmark scores, or local "AI" identities.

export interface UpgradableModelInfo {
  id: string;
  name: string;
  generation: string;
  provider: string;
  releaseDate: string;
  status: "ACTIVE_PRODUCTION" | "PENDING_FOUNDER_APPROVAL" | "AVAILABLE_UPDATE" | "UNVERIFIED";
  improvements: string[];
  performanceGainPct: number | null;
  benchmarkScore: number | null;
}

export const INITIAL_MODEL_REGISTRY: UpgradableModelInfo[] = [
  {
    id: "gpt-5.6-luna",
    name: "OpenAI GPT-5.6 Luna",
    generation: "gpt-5.6-luna",
    provider: "OpenAI",
    releaseDate: "Provider-discovered",
    status: "UNVERIFIED",
    improvements: [],
    performanceGainPct: null,
    benchmarkScore: null,
  },
  {
    id: "gpt-5.6-terra",
    name: "OpenAI GPT-5.6 Terra",
    generation: "gpt-5.6-terra",
    provider: "OpenAI",
    releaseDate: "Provider-discovered",
    status: "UNVERIFIED",
    improvements: [],
    performanceGainPct: null,
    benchmarkScore: null,
  },
  {
    id: "gpt-5.6-sol",
    name: "OpenAI GPT-5.6 Sol",
    generation: "gpt-5.6-sol",
    provider: "OpenAI",
    releaseDate: "Provider-discovered",
    status: "UNVERIFIED",
    improvements: [],
    performanceGainPct: null,
    benchmarkScore: null,
  },
];

export interface PendingUpgradeNotification {
  upgradeId: string;
  title: string;
  sourceProvider: string;
  suggestedAction: string;
  autoApply: boolean;
  benchmarkGain: string;
  detectedAt: string;
}

function hasServerKey(key: string): boolean {
  try {
    return typeof process !== "undefined" && Boolean(process.env?.[key]?.trim());
  } catch {
    return false;
  }
}

export class AutonomousModelUpdater {
  private static instance: AutonomousModelUpdater;
  private registry: UpgradableModelInfo[] = [...INITIAL_MODEL_REGISTRY];
  private pendingNotifications: PendingUpgradeNotification[] = [];

  public static getInstance(): AutonomousModelUpdater {
    if (!AutonomousModelUpdater.instance) {
      AutonomousModelUpdater.instance = new AutonomousModelUpdater();
    }
    return AutonomousModelUpdater.instance;
  }

  public getModels(): UpgradableModelInfo[] {
    return this.registry.map((m) => ({ ...m }));
  }

  public checkForUpdates(): {
    updatesFound: boolean;
    notifications: PendingUpgradeNotification[];
    summary: string;
    activeModelsCount: number;
    availableUpgrades: UpgradableModelInfo[];
  } {
    const hasOpenAI = hasServerKey("OPENAI_API_KEY");
    this.registry = this.registry.map((model) => ({
      ...model,
      status: hasOpenAI ? "UNVERIFIED" : "PENDING_FOUNDER_APPROVAL",
    }));

    this.pendingNotifications = hasOpenAI
      ? [{
          upgradeId: "openai-runtime-discovery",
          title: "OpenAI model availability check required",
          sourceProvider: "OpenAI API",
          suggestedAction: "Query the provider model list before enabling or changing a production model route.",
          autoApply: false,
          benchmarkGain: "Not measured",
          detectedAt: new Date().toISOString(),
        }]
      : [{
          upgradeId: "openai-configuration",
          title: "OpenAI credentials are required",
          sourceProvider: "OpenAI API",
          suggestedAction: "Configure OPENAI_API_KEY on the server before enabling live AI execution.",
          autoApply: false,
          benchmarkGain: "Not measured",
          detectedAt: new Date().toISOString(),
        }];

    return {
      updatesFound: true,
      notifications: [...this.pendingNotifications],
      summary: hasOpenAI
        ? "OpenAI credentials are configured, but model availability and performance remain UNVERIFIED until the provider is queried."
        : "OpenAI is not configured. Live AI remains BLOCKED; no simulated/local model is advertised.",
      activeModelsCount: this.registry.length,
      availableUpgrades: [],
    };
  }

  public applyUpgrade(upgradeId: string): boolean {
    const existing = this.registry.find((m) => m.id === upgradeId);
    if (!existing) return false;
    if (!hasServerKey("OPENAI_API_KEY")) return false;
    existing.status = "UNVERIFIED";
    return false;
  }
}

export const autonomousModelUpdater = AutonomousModelUpdater.getInstance();
