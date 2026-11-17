import crypto from "node:crypto";

/**
 * ============================================================================
 * UMAR OS TWO-FACTOR AUTHENTICATION (TOTP - RFC 6238 / FIDO2 / RECOVERY CODES)
 * ============================================================================
 * Implements strict administrative 2FA:
 * 1. TOTP time-step generation & verification (RFC 6238, 30s window, ±1 step drift)
 * 2. High-entropy base32 secret generation for Google Authenticator / Authy
 * 3. Single-use cryptographically hashed backup recovery codes
 * ============================================================================
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(byteLength = 20): string {
  const buffer = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanInput[i]!);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpCode(secretBase32: string, timeStepWindow = 0, timeStepSec = 30): string {
  const key = base32Decode(secretBase32);
  const currentCounter = Math.floor(Date.now() / 1000 / timeStepSec) + timeStepWindow;

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(currentCounter));

  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const codeInt = (
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff)
  ) % 1_000_000;

  return String(codeInt).padStart(6, "0");
}

export function verifyTotpCode(secretBase32: string, token: string, allowedWindowDrift = 1): boolean {
  if (!token || !/^\d{6}$/.test(token.trim())) return false;
  const cleanToken = token.trim();

  for (let drift = -allowedWindowDrift; drift <= allowedWindowDrift; drift++) {
    const expected = generateTotpCode(secretBase32, drift);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

export interface GeneratedRecoveryCodes {
  plainCodes: string[];
  hashedCodes: string[];
}

export function generateRecoveryCodes(count = 8): GeneratedRecoveryCodes {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    plainCodes.push(formatted);

    const hash = crypto.createHash("sha256").update(formatted).digest("hex");
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

export function verifyRecoveryCode(
  submittedCode: string,
  storedHashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const cleanSubmitted = submittedCode.trim().toUpperCase();
  const submittedHash = crypto.createHash("sha256").update(cleanSubmitted).digest("hex");

  const matchIdx = storedHashedCodes.findIndex((h) =>
    crypto.timingSafeEqual(Buffer.from(h), Buffer.from(submittedHash))
  );

  if (matchIdx === -1) {
    return { valid: false, remainingHashedCodes: storedHashedCodes };
  }

  // Consume single-use code
  const remaining = [...storedHashedCodes];
  remaining.splice(matchIdx, 1);
  return { valid: true, remainingHashedCodes: remaining };
}
