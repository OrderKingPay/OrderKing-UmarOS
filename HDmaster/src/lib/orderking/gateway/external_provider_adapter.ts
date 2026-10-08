import { CircuitBreaker } from './circuit_breaker';

export interface ProviderResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Provider {
  name: string;
  request(endpoint: string, payload: any): Promise<ProviderResponse>;
}

export class ExternalProviderAdapter {
  private timeoutMs: number;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private primaryProvider: Provider;
  private fallbackProvider: Provider | null;

  constructor(primaryProvider: Provider, fallbackProvider: Provider | null = null, timeoutMs: number = 2000) {
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
    this.timeoutMs = timeoutMs;
    this.circuitBreakers = new Map();
    this.circuitBreakers.set(primaryProvider.name, new CircuitBreaker());
    if (fallbackProvider) {
      this.circuitBreakers.set(fallbackProvider.name, new CircuitBreaker());
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Request Timeout: Exceeded ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  async executeRequest(endpoint: string, payload: any): Promise<ProviderResponse> {
    return this.attemptRequest(this.primaryProvider, endpoint, payload).catch((error) => {
      console.warn(`Primary provider ${this.primaryProvider.name} failed: ${error.message}. Switching to fallback.`);
      if (this.fallbackProvider) {
        return this.attemptRequest(this.fallbackProvider, endpoint, payload);
      }
      throw new Error(`All providers failed. Last error: ${error.message}`);
    });
  }

  private async attemptRequest(provider: Provider, endpoint: string, payload: any): Promise<ProviderResponse> {
    const cb = this.circuitBreakers.get(provider.name)!;
    return cb.execute(() => this.withTimeout(provider.request(endpoint, payload), this.timeoutMs));
  }
}
