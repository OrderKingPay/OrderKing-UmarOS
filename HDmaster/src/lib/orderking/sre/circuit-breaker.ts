export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private nextAttempt: number = 0;

  private failureThreshold: number;
  private resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeoutMs = options.resetTimeoutMs;
  }

  getState(): CircuitBreakerState {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitBreakerState.HALF_OPEN;
      }
    }
    return this.state;
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.nextAttempt = 0;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();
    if (currentState === CircuitBreakerState.OPEN) {
      throw new CircuitBreakerError('Circuit is OPEN');
    }

    try {
      const result = await fn();
      return this.onSuccess(result);
    } catch (error) {
      return this.onFailure(error);
    }
  }

  private onSuccess<T>(result: T): T {
    const currentState = this.getState();
    if (currentState === CircuitBreakerState.HALF_OPEN) {
      this.reset();
    } else {
      this.failureCount = 0; // reset on success in CLOSED state too
    }
    return result;
  }

  private onFailure(error: unknown): never {
    const currentState = this.getState();
    if (currentState === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    } else {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.nextAttempt = Date.now() + this.resetTimeoutMs;
      }
    }
    throw error;
  }
}
