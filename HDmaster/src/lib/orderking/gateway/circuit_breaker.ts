export enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureThreshold: number;
  private resetTimeout: number;
  private failureCount: number = 0;
  private nextAttemptTime: number = 0;

  constructor(failureThreshold: number = 3, resetTimeout: number = 10000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() > this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit Breaker is OPEN');
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.resetTimeout;
    }
  }
}
