import * as crypto from 'crypto';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

export class WebhookDispatcher {
  private targetUrls: string[];
  private secret: string;
  private maxRetries: number;
  private baseBackoffMs: number;

  constructor(targetUrls: string[], secret: string, maxRetries = 3, baseBackoffMs = 1000) {
    this.targetUrls = targetUrls;
    this.secret = secret;
    this.maxRetries = maxRetries;
    this.baseBackoffMs = baseBackoffMs;
  }

  public async dispatchEvent(event: string, data: any): Promise<void> {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const signature = this.signPayload(payloadString);

    const dispatchPromises = this.targetUrls.map((url) =>
      this.dispatchWithRetry(url, payloadString, signature)
    );

    await Promise.allSettled(dispatchPromises);
  }

  private signPayload(payloadString: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(payloadString)
      .digest('hex');
  }

  private async dispatchWithRetry(
    url: string,
    payloadString: string,
    signature: string,
    attempt: number = 0
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: payloadString,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      if (attempt < this.maxRetries) {
        const backoffTime = this.baseBackoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        return this.dispatchWithRetry(url, payloadString, signature, attempt + 1);
      } else {
        console.error(`Failed to dispatch webhook to ${url} after ${this.maxRetries} attempts`, error);
      }
    }
  }
}
