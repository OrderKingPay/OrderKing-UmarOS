import { ConnectorRegistry, HealthStatus } from './registry';

export class HealthMonitor {
  constructor(private registry: ConnectorRegistry) {}

  async checkHealth(id: string, timeoutMs: number = 5000): Promise<HealthStatus> {
    const connector = this.registry.getConnector(id);
    if (!connector) {
      throw new Error(`Connector with ID ${id} not found`);
    }

    if (!connector.endpoint) {
      const status = 'UNKNOWN';
      this.registry.updateHealth(id, status);
      return status;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(connector.endpoint, {
        method: 'GET',
        signal: controller.signal,
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Timeout');
        }
        throw err;
      });

      clearTimeout(timeoutId);

      let status: HealthStatus = 'UNHEALTHY';
      if (response.ok) {
         status = 'HEALTHY';
      } else if (response.status >= 500) {
         status = 'UNHEALTHY';
      } else {
         status = 'DEGRADED';
      }

      this.registry.updateHealth(id, status);
      return status;
    } catch (error) {
      this.registry.updateHealth(id, 'UNHEALTHY');
      return 'UNHEALTHY';
    }
  }

  async checkAll(timeoutMs: number = 5000): Promise<Record<string, HealthStatus>> {
    const connectors = this.registry.getAll();
    const results: Record<string, HealthStatus> = {};
    
    await Promise.all(
      connectors.map(async (c) => {
        results[c.id] = await this.checkHealth(c.id, timeoutMs);
      })
    );

    return results;
  }
}
