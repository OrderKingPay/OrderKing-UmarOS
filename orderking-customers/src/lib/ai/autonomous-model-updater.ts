// Real provider model configuration state.
// This module deliberately does not invent benchmark scores or claim that a
// provider release exists unless the provider catalog has been queried.

export interface UpgradableModelInfo {
  id: string;
  name: string;
  generation: string;
  provider: string;
  releaseDate: string;
  status: "ACTIVE_PRODUCTION" | "PENDING_FOUNDER_APPROVAL" | "AVAILABLE_UPDATE";
  improvements: string[];
  performanceGainPct?: number;
  benchmarkScore?: number;
}

export interface PendingUpgradeNotification {
  upgradeId: string;
  title: string;
  sourceProvider: string;
  suggestedAction: string;
  autoApply: boolean;
  benchmarkGain?: string;
  detectedAt: string;
}

const PROVIDERS = [
  { key: "OPENAI_API_KEY", modelKey: "OPENAI_MODEL", provider: "OpenAI" },
  { key: "GEMINI_API_KEY", modelKey: "GEMINI_MODEL", provider: "Google Gemini" },
  { key: "ANTHROPIC_API_KEY", modelKey: "ANTHROPIC_MODEL", provider: "Anthropic" },
  { key: "XAI_API_KEY", modelKey: "XAI_MODEL", provider: "xAI" },
] as const;

function env(key: string): string {
  try {
    return process.env?.[key]?.trim() || "";
  } catch {
    return "";
  }
}

export const INITIAL_MODEL_REGISTRY: UpgradableModelInfo[] = PROVIDERS.map((p) => {
  const configured = Boolean(env(p.key));
  const selected = env(p.modelKey);
  return {
    id: `${p.provider.toLowerCase().replace(/\s+/g, "-")}-runtime`,
    name: `${p.provider} (server-selected model)`,
    generation: selected || "provider-selected-at-runtime",
    provider: p.provider,
    releaseDate: "Provider catalog must be queried",
    status: configured ? "ACTIVE_PRODUCTION" : "PENDING_FOUNDER_APPROVAL",
    improvements: [],
  };
});

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
    return this.registry.map((model) => ({ ...model }));
  }

  /**
   * Synchronous status check: reports only locally known configuration.
   * Live provider release scanning is intentionally asynchronous and must be
   * performed through an authenticated server-side provider catalog call.
   */
  public checkForUpdates() {
    const configured = this.registry.filter((m) => m.status === "ACTIVE_PRODUCTION").length;
    this.pendingNotifications = [];
    return {
      updatesFound: false,
      notifications: [],
      summary: `Provider configuration status: ${configured}/${this.registry.length} providers have server credentials. No frontier release or benchmark is claimed without a live provider catalog check.`,
      activeModelsCount: configured,
      availableUpgrades: [],
    };
  }

  public applyUpgrade(upgradeId: string): boolean {
    const existing = this.registry.find((m) => m.id === upgradeId);
    if (!existing) return false;
    if (existing.status !== "ACTIVE_PRODUCTION") return false;
    // Provider model changes are controlled by secure server environment, never
    // by a client-side registry mutation.
    return true;
  }
}

export const autonomousModelUpdater = AutonomousModelUpdater.getInstance();
