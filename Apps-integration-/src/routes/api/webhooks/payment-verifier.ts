import crypto from 'crypto';
import { Pool } from 'pg';

export class PaymentVerifier {
  private secret: string;
  private maxToleranceSeconds: number;
  private dbPool: Pool;

  constructor(secret: string, dbPool: Pool, maxToleranceSeconds = 300) {
    this.secret = secret;
    this.dbPool = dbPool;
    this.maxToleranceSeconds = maxToleranceSeconds;
  }

  /**
   * Mathematically verifies the HMAC SHA256 signature.
   * Compares the expected signature to the provided signature using a constant-time comparison
   * to prevent timing attacks.
   */
  public verifySignature(rawBody: string, signature: string, timestamp: number): boolean {
    // Reconstruct the signed payload (e.g., Stripe style: timestamp.payload)
    const signedPayload = `${timestamp}.${rawBody}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(signedPayload)
      .digest('hex');

    try {
      const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
      const signatureBuffer = Buffer.from(signature, 'utf-8');
      
      if (expectedBuffer.length !== signatureBuffer.length) {
         return false;
      }
      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (e) {
      return false; 
    }
  }

  /**
   * Process webhook with full security checks (Timestamp validation, Signature check, Idempotency check).
   */
  public async processWebhook(
    rawBody: string, 
    headers: Record<string, string>,
    idempotencyKey: string
  ): Promise<{ success: boolean; message: string }> {
    // Extract required headers (supporting common headers like Stripe or generic X-Signature)
    const signature = headers['x-signature'] || headers['stripe-signature'];
    const timestampStr = headers['x-timestamp'] || headers['stripe-timestamp'];
    
    if (!signature || !timestampStr || !idempotencyKey) {
      throw new Error('Missing critical headers or idempotency key');
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    
    // 1. Prevent Replay Attacks
    // Ensure the timestamp is within the acceptable tolerance window
    if (Math.abs(now - timestamp) > this.maxToleranceSeconds) {
      throw new Error('Timestamp outside of tolerance - potential replay attack');
    }

    // 2. Cryptographic Signature Verification
    if (!this.verifySignature(rawBody, signature, timestamp)) {
      throw new Error('Invalid payment signature');
    }

    // 3. Idempotency Check against the `idempotency_keys` table
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      
      // Attempt to insert the idempotency key. If it already exists, the CONFLICT clause prevents insertion.
      const res = await client.query(
        'INSERT INTO idempotency_keys (key, created_at) VALUES ($1, NOW()) ON CONFLICT (key) DO NOTHING RETURNING key',
        [idempotencyKey]
      );

      if (res.rowCount === 0) {
        // Idempotency key already exists, meaning this webhook was already processed.
        await client.query('ROLLBACK');
        return { success: true, message: 'Webhook already processed (idempotency hit)' };
      }

      // If insertion was successful, commit the transaction and allow the webhook to be processed further
      await client.query('COMMIT');
      return { success: true, message: 'Webhook verified and processed securely' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
