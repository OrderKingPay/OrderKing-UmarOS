import { createHmac } from 'crypto';
import { ReplayProtector } from './replay-protection';
import { DeadLetterQueue } from './dead-letter';

export interface Verifier {
  verify(payload: string, signature: string, secret: string): boolean;
  extractEventId(payload: any, headers: Record<string, string>): string | undefined;
}

export interface IngestResult {
  success: boolean;
  error?: string;
  isReplay?: boolean;
}

export class DefaultHmacVerifier implements Verifier {
  verify(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }

  extractEventId(payload: any, headers: Record<string, string>): string | undefined {
    return payload?.id || headers['x-webhook-id'];
  }
}

export class WebhookIngestion {
  private verifiers = new Map<string, Verifier>();
  private secrets = new Map<string, string>();
  private replayProtector: ReplayProtector;
  private deadLetterQueue: DeadLetterQueue;

  constructor(replayProtector?: ReplayProtector, deadLetterQueue?: DeadLetterQueue) {
    this.replayProtector = replayProtector || new ReplayProtector();
    this.deadLetterQueue = deadLetterQueue || new DeadLetterQueue();
  }

  register(provider: string, secret: string, verifier?: Verifier): void {
    this.secrets.set(provider, secret);
    this.verifiers.set(provider, verifier || new DefaultHmacVerifier());
  }

  ingest(
    provider: string,
    payloadRaw: string,
    signature: string,
    headers: Record<string, string> = {}
  ): IngestResult {
    const verifier = this.verifiers.get(provider);
    const secret = this.secrets.get(provider);

    if (!verifier || !secret) {
      const error = `Provider ${provider} not registered`;
      this.deadLetterQueue.enqueue({ provider, payload: payloadRaw, error: new Error(error) });
      return { success: false, error };
    }

    if (!verifier.verify(payloadRaw, signature, secret)) {
      const error = 'Invalid signature';
      this.deadLetterQueue.enqueue({ provider, payload: payloadRaw, error: new Error(error) });
      return { success: false, error };
    }

    let payloadObj;
    try {
      payloadObj = JSON.parse(payloadRaw);
    } catch (e) {
      const error = 'Invalid JSON payload';
      this.deadLetterQueue.enqueue({ provider, payload: payloadRaw, error: new Error(error) });
      return { success: false, error };
    }

    const eventId = verifier.extractEventId(payloadObj, headers);
    if (eventId) {
      if (this.replayProtector.isReplay(eventId)) {
        return { success: true, isReplay: true };
      }
      this.replayProtector.markProcessed(eventId);
    }

    // Processing would happen here (routing). For now, it's successful ingestion.
    return { success: true };
  }

  getDeadLetterQueue(): DeadLetterQueue {
    return this.deadLetterQueue;
  }
}
