export type ConnectorType = 'API' | 'MCP' | 'A2A' | 'WEBHOOK' | 'OAUTH' | 'SDK' | 'OPENAPI';
export type HealthStatus = 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface ConnectorConfig {
  id: string;
  name: string;
  type: ConnectorType;
  endpoint?: string;
  authScheme?: string;
  capabilities: string[];
  healthStatus: HealthStatus;
  version: string;
  createdAt: Date;
  revokedAt?: Date;
}

export class ConnectorRegistry {
  private connectors = new Map<string, ConnectorConfig>();

  register(config: Omit<ConnectorConfig, 'healthStatus' | 'createdAt'>): ConnectorConfig {
    if (this.connectors.has(config.id)) {
      throw new Error(`Connector with ID ${config.id} already exists`);
    }
    const newConfig: ConnectorConfig = {
      ...config,
      healthStatus: 'UNKNOWN',
      createdAt: new Date(),
    };
    this.connectors.set(config.id, newConfig);
    return newConfig;
  }

  unregister(id: string): void {
    if (!this.connectors.has(id)) {
      throw new Error(`Connector with ID ${id} not found`);
    }
    this.connectors.delete(id);
  }

  discover(filter: Partial<ConnectorConfig>): ConnectorConfig[] {
    return Array.from(this.connectors.values()).filter(connector => {
      let matches = true;
      for (const key in filter) {
        if (connector[key as keyof ConnectorConfig] !== filter[key as keyof ConnectorConfig]) {
          matches = false;
          break;
        }
      }
      return matches;
    });
  }

  getConnector(id: string): ConnectorConfig | undefined {
    return this.connectors.get(id);
  }

  updateHealth(id: string, status: HealthStatus): void {
    const connector = this.connectors.get(id);
    if (connector) {
      connector.healthStatus = status;
    }
  }

  getAll(): ConnectorConfig[] {
    return Array.from(this.connectors.values());
  }
}
