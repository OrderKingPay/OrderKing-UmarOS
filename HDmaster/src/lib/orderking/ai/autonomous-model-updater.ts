// Umar OS: Autonomous Frontier Model Updater & Registry Engine
// Tracks, verifies, and manages frontier AI model releases (GPT-4o, Claude 3.7 Sonnet, Grok 2, Gemini 2.0 Flash)
// Never claims a model is live without an actual connectivity check.
// API-key presence alone is not treated as a successful model connection.

export interface UpgradableModelInfo {
  id: string;
  name: string;
  generation: string;
  provider: string;
  releaseDate: string;
  status: "ACTIVE_PRODUCTION" | "PENDING_FOUNDER_APPROVAL" | "AVAILABLE_UPDATE";
  improvements: string[];
  performanceGainPct: number;
  benchmarkScore: number;
}

export const INITIAL_MODEL_REGISTRY: UpgradableModelInfo[] = [
  {
    id: "gpt-5.6-sol",
    name: "OpenAI GPT-5.6 Sol",
    generation: "gpt-5.6-sol",
    provider: "OpenAI",
    releaseDate: "Current OpenAI flagship",
    status: "PENDING_FOUNDER_APPROVAL",
    improvements: ["Complex reasoning", "Coding", "Multimodal input", "Tool-enabled workflows"],
    performanceGainPct: 0,
    benchmarkScore: 0,
  },
  {
    id: "gpt-5.6-terra",
    name: "OpenAI GPT-5.6 Terra",
    generation: "gpt-5.6-terra",
    provider: "OpenAI",
    releaseDate: "Current OpenAI cost/performance tier",
    status: "PENDING_FOUNDER_APPROVAL",
    improvements: ["Reasoning", "Coding", "Multimodal input", "Tool-enabled workflows"],
    performanceGainPct: 0,
    benchmarkScore: 0,
  },
  {
    id: "gpt-5.6-luna",
    name: "OpenAI GPT-5.6 Luna",
    generation: "gpt-5.6-luna",
    provider: "OpenAI",
    releaseDate: "Current OpenAI high-volume tier",
    status: "PENDING_FOUNDER_APPROVAL",
    improvements: ["Cost-sensitive workloads", "Coding", "Multimodal input", "Tool-enabled workflows"],
    performanceGainPct: 0,
    benchmarkScore: 0,
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

function getEnvOrStorage(key: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process?.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  try {
    if (typeof window !== "undefined" && window?.localStorage) {
      return window.localStorage.getItem(key) || undefined;
    }
  } catch {}
  return undefined;
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
    return this.registry;
  }

  public checkForUpdates(): {
    updatesFound: boolean;
    notifications: PendingUpgradeNotification[];
    summary: string;
    activeModelsCount: number;
    availableUpgrades: UpgradableModelInfo[];
  } {
    const hasOpenAI = Boolean(getEnvOrStorage("OPENAI_API_KEY"));
    const availableUpgrades = this.registry.map((model) => ({
      ...model,
      status: hasOpenAI ? "PENDING_FOUNDER_APPROVAL" as const : "PENDING_FOUNDER_APPROVAL" as const,
    }));

    const notifications: PendingUpgradeNotification[] = hasOpenAI
      ? []
      : [{
          upgradeId: "openai-key-required",
          title: "OpenAI provider configuration required",
          sourceProvider: "OpenAI",
          suggestedAction: "Configure OPENAI_API_KEY and run live model connectivity tests before enabling production routing.",
          autoApply: false,
          benchmarkGain: "Not measured",
          detectedAt: "Not verified",
        }];

    this.pendingNotifications = notifications;
    return {
      updatesFound: notifications.length > 0,
      notifications,
      summary: hasOpenAI
        ? "OpenAI models are configured but still require live connectivity verification before being marked production-active."
        : "No verified external AI provider is configured.",
      activeModelsCount: 0,
      availableUpgrades,
    };
  }

  public applyUpgrade(_upgradeId: string): boolean {
    // Registry changes are not treated as provider verification or live routing.
    return false;
  }}

export const autonomousModelUpdater = AutonomousModelUpdater.getInstance();
