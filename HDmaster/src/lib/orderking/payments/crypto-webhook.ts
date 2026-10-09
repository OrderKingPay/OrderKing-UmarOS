import * as crypto from 'crypto';

/**
 * Verifies a Razorpay webhook signature.
 * Throws an error if the signature is invalid.
 */
export function verifyRazorpayWebhook(payloadStr: string, signature: string, secret: string): boolean {
  if (!payloadStr || !signature || !secret) {
    throw new Error('Missing payload, signature, or secret for Razorpay verification');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid Razorpay webhook signature');
  }

  return true;
}

/**
 * Verifies a Stripe webhook signature.
 * Note: A real Stripe webhook signature contains a timestamp (t=...) and one or more signatures (v1=...).
 * This implements the strict HMAC SHA256 verification for Stripe setups.
 * Throws an error if the signature is invalid.
 */
export function verifyStripeWebhook(payloadStr: string, signatureHeader: string, secret: string): boolean {
  if (!payloadStr || !signatureHeader || !secret) {
    throw new Error('Missing payload, signature header, or secret for Stripe verification');
  }

  // Parse the signature header (e.g. "t=123,v1=abc,v0=def")
  const parsedHeader = signatureHeader.split(',').reduce((acc: Record<string, string>, pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const timestamp = parsedHeader['t'];
  const signature = parsedHeader['v1'];

  if (!timestamp || !signature) {
    throw new Error('Invalid Stripe signature header format');
  }

  const signedPayload = `${timestamp}.${payloadStr}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid Stripe webhook signature');
  }

  return true;
}
