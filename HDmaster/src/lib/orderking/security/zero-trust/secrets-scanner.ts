/**
 * Scans objects/responses to ensure no sensitive API keys are exposed to the client.
 */
export class SecretsScanner {
  // Regex patterns for common sensitive keys
  private static PATTERNS = [
    /rzp_(test|live)_[a-zA-Z0-9]+/, // Razorpay
    /sk-(proj|ant)-[a-zA-Z0-9_-]+/, // OpenAI
    /sbp_[a-zA-Z0-9]+/, // Supabase (mock pattern)
    /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/ // JWT (Basic check)
  ];

  /**
   * Scans an outgoing API response object and throws if secrets are detected.
   */
  public static scanResponse(data: any): void {
    if (data === undefined || data === null) return;
    const jsonString = JSON.stringify(data);
    
    for (const pattern of this.PATTERNS) {
      if (pattern.test(jsonString)) {
        throw new Error("FATAL: Sensitive secret detected in outgoing response payload! Response blocked.");
      }
    }
  }

  /**
   * Sanitizes an object by removing common sensitive fields.
   */
  public static sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const clone = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveKeys = ['apikey', 'secret', 'password', 'token', 'razorpay_key', 'privatekey'];

    for (const key in clone) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        clone[key] = '[REDACTED]';
      } else if (typeof clone[key] === 'object') {
        clone[key] = this.sanitize(clone[key]);
      }
    }
    return clone;
  }
}
