export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter?: boolean;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > opts.maxRetries) {
        throw error;
      }

      const exp = Math.pow(2, attempt - 1);
      let delay = Math.min(opts.baseDelayMs * exp, opts.maxDelayMs);

      if (opts.jitter) {
        // Full jitter
        delay = Math.random() * delay;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
