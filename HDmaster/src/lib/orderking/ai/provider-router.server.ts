export type ProviderType = 'gemini' | 'anthropic' | 'openai' | 'local';

export interface ProviderConfig {
  id: ProviderType;
  baseLatencyMs: number;
  costPer1kTokens: number;
  capabilities: string[];
  maxTokens: number;
}

export interface RouteRequest {
  maxLatencyMs?: number;
  maxCost?: number;
  requiredCapabilities?: string[];
  payload: any;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime?: number;
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  resetTimeoutMs: 30000,
};

const providers: Record<ProviderType, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    baseLatencyMs: 300,
    costPer1kTokens: 0.0001,
    capabilities: ['multimodal', 'reasoning', 'coding'],
    maxTokens: 1048576,
  },
  anthropic: {
    id: 'anthropic',
    baseLatencyMs: 400,
    costPer1kTokens: 0.003,
    capabilities: ['reasoning', 'coding', 'long-context'],
    maxTokens: 200000,
  },
  openai: {
    id: 'openai',
    baseLatencyMs: 350,
    costPer1kTokens: 0.002,
    capabilities: ['reasoning', 'coding', 'function-calling'],
    maxTokens: 128000,
  },
  local: {
    id: 'local',
    baseLatencyMs: 50,
    costPer1kTokens: 0,
    capabilities: ['privacy', 'offline'],
    maxTokens: 8192,
  },
};

const circuitBreakers: Record<ProviderType, CircuitBreakerState> = {
  gemini: { failures: 0, status: 'CLOSED' },
  anthropic: { failures: 0, status: 'CLOSED' },
  openai: { failures: 0, status: 'CLOSED' },
  local: { failures: 0, status: 'CLOSED' },
};

export class ProviderRouter {
  public route(request: RouteRequest): ProviderConfig {
    const availableProviders = Object.values(providers).filter(provider => {
      // 1. Check Circuit Breaker
      if (!this.isProviderHealthy(provider.id)) {
        return false;
      }
      
      // 2. Check Latency
      if (request.maxLatencyMs && provider.baseLatencyMs > request.maxLatencyMs) {
        return false;
      }

      // 3. Check Cost
      if (request.maxCost && provider.costPer1kTokens > request.maxCost) {
        return false;
      }

      // 4. Check Capabilities
      if (request.requiredCapabilities) {
        const hasAllCapabilities = request.requiredCapabilities.every(cap => 
          provider.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }

      return true;
    });

    if (availableProviders.length === 0) {
      throw new Error('No suitable AI provider found for the requested criteria.');
    }

    // Sort by cost, then latency
    availableProviders.sort((a, b) => {
      if (a.costPer1kTokens === b.costPer1kTokens) {
        return a.baseLatencyMs - b.baseLatencyMs;
      }
      return a.costPer1kTokens - b.costPer1kTokens;
    });

    return availableProviders[0];
  }

  public recordSuccess(providerId: ProviderType) {
    const cb = circuitBreakers[providerId];
    if (cb) {
      cb.failures = 0;
      cb.status = 'CLOSED';
    }
  }

  public recordFailure(providerId: ProviderType) {
    const cb = circuitBreakers[providerId];
    if (cb) {
      cb.failures++;
      cb.lastFailureTime = Date.now();
      
      if (cb.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
        cb.status = 'OPEN';
      }
    }
  }

  private isProviderHealthy(providerId: ProviderType): boolean {
    const cb = circuitBreakers[providerId];
    if (!cb) return false;

    if (cb.status === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (cb.lastFailureTime || 0);
      if (timeSinceLastFailure > CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
        cb.status = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    return true;
  }
}
