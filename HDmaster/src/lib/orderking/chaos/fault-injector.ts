export class FaultInjector {
  /**
   * Wraps a function with a given delay.
   */
  static injectLatency<T extends (...args: any[]) => Promise<any>>(
    targetFn: T,
    delayMs: number
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return targetFn(...args);
    }) as T;
  }

  /**
   * Throws an error at the specified rate (0.0 to 1.0).
   */
  static injectFailure<T extends (...args: any[]) => Promise<any>>(
    targetFn: T,
    errorRate: number,
    error: Error = new Error('Injected failure')
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (Math.random() < errorRate) {
        throw error;
      }
      return targetFn(...args);
    }) as T;
  }

  /**
   * Aborts the function after a timeout.
   */
  static injectTimeout<T extends (...args: any[]) => Promise<any>>(
    targetFn: T,
    timeoutMs: number
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Injected timeout')), timeoutMs);
      });
      return Promise.race([targetFn(...args), timeoutPromise]);
    }) as T;
  }
}
