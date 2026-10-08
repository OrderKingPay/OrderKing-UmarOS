export interface ChaosConfig {
  dbTimeoutProbability?: number; // 0.0 to 1.0
  apiLatencyProbability?: number;
  redisDropProbability?: number;
  apiLatencyRangeMs?: [number, number];
  enabled: boolean;
}

export class ChaosTestingEngine {
  private config: ChaosConfig = {
    enabled: false,
    dbTimeoutProbability: 0,
    apiLatencyProbability: 0,
    redisDropProbability: 0,
    apiLatencyRangeMs: [500, 3000]
  };

  constructor(config?: Partial<ChaosConfig>) {
    if (config) {
      this.updateConfig(config);
    }
  }

  updateConfig(config: Partial<ChaosConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  enable() {
    this.config.enabled = true;
  }
  
  disable() {
    this.config.enabled = false;
  }

  /**
   * Simulates a DB timeout. Throws an error randomly based on probability.
   */
  async interceptDbQuery(): Promise<void> {
    if (!this.config.enabled || !this.config.dbTimeoutProbability) return;
    
    if (Math.random() < this.config.dbTimeoutProbability) {
      throw new Error("ChaosEngine: Simulated Database Timeout");
    }
  }

  /**
   * Simulates API latency spikes. Delays execution based on probability.
   */
  async interceptApiCall(): Promise<void> {
    if (!this.config.enabled || !this.config.apiLatencyProbability) return;

    if (Math.random() < this.config.apiLatencyProbability) {
      const [min, max] = this.config.apiLatencyRangeMs || [500, 3000];
      const latency = Math.floor(Math.random() * (max - min + 1)) + min;
      await new Promise(resolve => setTimeout(resolve, latency));
    }
  }

  /**
   * Simulates a Redis connection drop. Throws an error based on probability.
   */
  async interceptRedisCommand(): Promise<void> {
    if (!this.config.enabled || !this.config.redisDropProbability) return;

    if (Math.random() < this.config.redisDropProbability) {
      throw new Error("ChaosEngine: Simulated Redis Connection Drop");
    }
  }
}
