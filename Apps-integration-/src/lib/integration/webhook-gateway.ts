import * as crypto from "node:crypto";

export class WebhookGateway {
  /**
   * Verifies a Razorpay webhook signature.
   * @param payload The raw request body as a string.
   * @param signature The `x-razorpay-signature` header value.
   * @param secret The Razorpay webhook secret.
   * @returns boolean True if signature is valid.
   */
  static verifyRazorpaySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
        
      if (signature.length !== expectedSignature.length) return false;
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Verifies a Twilio webhook signature.
   * @param url The full webhook URL (including query params).
   * @param params The parsed form-urlencoded body parameters.
   * @param signature The `x-twilio-signature` header value.
   * @param authToken The Twilio Auth Token.
   * @returns boolean True if signature is valid.
   */
  static verifyTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): boolean {
    try {
      let dataToSign = url;
      // Sort keys alphabetically
      const sortedKeys = Object.keys(params).sort();
      
      for (const key of sortedKeys) {
        dataToSign += key + params[key];
      }
      
      const expectedSignature = crypto
        .createHmac("sha1", authToken)
        .update(dataToSign)
        .digest("base64");
        
      if (signature.length !== expectedSignature.length) return false;
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Verifies a MessageBird webhook signature.
   * @param url The full request URL.
   * @param rawBody The raw request body.
   * @param signature The `MessageBird-Signature` header value.
   * @param timestamp The `MessageBird-Request-Timestamp` header value.
   * @param signingKey The MessageBird signing key.
   * @returns boolean True if signature is valid.
   */
  static verifyMessageBirdSignature(
    url: string,
    rawBody: string,
    signature: string,
    timestamp: string,
    signingKey: string
  ): boolean {
    try {
      // Basic MessageBird verification logic (simplified)
      // Reference: https://developers.messagebird.com/api/webhooks/#verify-webhook-signatures
      const urlObj = new URL(url);
      const queryParams = urlObj.search.replace('?', '');
      const dataToSign = `${timestamp}\n${queryParams}\n${rawBody}`;
      
      const expectedSignature = crypto
        .createHmac("sha256", signingKey)
        .update(dataToSign)
        .digest("base64");
        
      // Sometimes MessageBird provides base64 url safe or standard base64.
      // Comparing length first.
      if (signature.length !== expectedSignature.length && 
          signature !== expectedSignature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')) {
         // fallback check for alternative encodings isn't strictly crypto timing safe, but acceptable for length mismatch
      }
      
      // We will assume standard base64 string provided in header
      const sigBuffer = Buffer.from(signature, 'base64');
      const expectedBuffer = Buffer.from(expectedSignature, 'base64');
      
      if (sigBuffer.length !== expectedBuffer.length) return false;
      
      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (e) {
      return false;
    }
  }
}
