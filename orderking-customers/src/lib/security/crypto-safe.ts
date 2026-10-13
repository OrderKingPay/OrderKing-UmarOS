import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compares two strings in constant time regardless of string length.
 * Uses a double-HMAC pattern with an ephemeral per-comparison key to prevent length-leakage side channels.
 */
export function timingSafeStringCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  
  // Ephemeral comparison key ensures comparison is strictly constant time
  const randomKey = "ct_cmp_" + Date.now().toString(36) + "_" + Math.random().toString(36);
  const hashA = createHmac("sha256", randomKey).update(a).digest();
  const hashB = createHmac("sha256", randomKey).update(b).digest();
  
  return timingSafeEqual(hashA, hashB);
}

/**
 * Compares two hex-encoded HMAC signatures in constant time.
 */
export function timingSafeHexCompare(expectedHex: string, receivedHex: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(receivedHex) || !/^[a-f0-9]{64}$/i.test(expectedHex)) {
    return false;
  }
  const bufA = Buffer.from(expectedHex, "hex");
  const bufB = Buffer.from(receivedHex, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
