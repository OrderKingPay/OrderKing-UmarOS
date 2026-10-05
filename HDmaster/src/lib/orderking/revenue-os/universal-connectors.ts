// Universal Connector Architecture & 3-Tier Provider Fallback.
// Built-in connectors are explicit provider boundaries. They never manufacture
// successful payments, database health, or search results.

export type Capability =
  | "ai_inference"
  | "web_search"
  | "browser_automation"
  | "email_outreach"
  | "calendar"
  | "crm_sync"
  | "payments_upi"
  | "payments_card"
  | "accounting_ledger"
  | "cloud_deploy"
  | "git_ops"
  | "database_query"
  | "storage"
  | "voice_speech"
  | "vision_ocr";

export interface Connector {
  id: string;
  name: string;
  capabilities: Capability[];
  authenticate(): Promise<void>;
  execute(action: string, input: unknown): Promise<unknown>;
  healthCheck(): Promise<boolean>;
}

const unavailable = (id: string, action: string): never => {
  throw new Error(`Connector ${id} is unavailable for ${action} until a real provider is registered and verified.`);
};

export class UniversalConnectorRegistry {
  private connectors: Map<string, Connector> = new Map();

  constructor() {
    this.registerStandardConnectors();
  }

  private registerStandardConnectors() {
    this.register({
      id: "conn-king-pay-upi",
      name: "King Pay UPI Provider Boundary",
      capabilities: ["payments_upi", "accounting_ledger"],
      async authenticate() { unavailable(this.id, "authenticate"); },
      async execute(action) { return unavailable(this.id, action); },
      async healthCheck() { return false; },
    });

    this.register({
      id: "conn-postgres-ledger",
      name: "PostgreSQL Ledger Provider Boundary",
      capabilities: ["database_query", "accounting_ledger"],
      async authenticate() { unavailable(this.id, "authenticate"); },
      async execute(action) { return unavailable(this.id, action); },
      async healthCheck() {
        // The actual database adapter is owned by the application DB layer.
        // This generic connector is not allowed to claim DB health by default.
        return false;
      },
    });

    this.register({
      id: "conn-web-search",
      name: "Web Search Provider Boundary",
      capabilities: ["web_search"],
      async authenticate() { unavailable(this.id, "authenticate"); },
      async execute(action) { return unavailable(this.id, action); },
      async healthCheck() { return false; },
    });
  }

  register(connector: Connector): void {
    this.connectors.set(connector.id, connector);
  }

  getConnector(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  listConnectors(): Connector[] {
    return Array.from(this.connectors.values());
  }

  async executeWithFallback<T>(params: {
    primaryConnectorId: string;
    secondaryConnectorId?: string;
    tertiaryConnectorId?: string;
    action: string;
    input: unknown;
  }): Promise<{ success: boolean; result?: T; executedBy?: string; error?: string; humanNoticeRequired?: boolean }> {
    const chain = [
      params.primaryConnectorId,
      params.secondaryConnectorId,
      params.tertiaryConnectorId,
    ].filter(Boolean) as string[];

    const errors: string[] = [];

    for (let i = 0; i < chain.length; i += 1) {
      const connId = chain[i];
      const conn = this.connectors.get(connId);

      if (!conn) {
        errors.push(`Tier ${i + 1} (${connId}) is not registered.`);
        continue;
      }

      try {
        const isHealthy = await conn.healthCheck();
        if (!isHealthy) {
          errors.push(`Tier ${i + 1} (${conn.name}) failed health check.`);
          continue;
        }

        const res = (await conn.execute(params.action, params.input)) as T;
        return { success: true, result: res, executedBy: conn.name };
      } catch (err) {
        errors.push(`Tier ${i + 1} (${conn.name}) execution failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      success: false,
      error: `ALL_PROVIDERS_FAILED: ${errors.join(" | ")}`,
      humanNoticeRequired: true,
    };
  }
}

export const universalConnectors = new UniversalConnectorRegistry();
