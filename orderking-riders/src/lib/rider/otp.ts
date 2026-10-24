import { sha256Hex, safeRandomBytesHex, safeTimingSafeEqual } from "./crypto-util";

export function generateOtp(length = 4): string {
  const n = 10 ** length;
  let val = 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    val = arr[0] % n;
  } else {
    val = Math.floor(Math.random() * n);
  }
  return String(val).padStart(length, "0");
}

export function hashOtp(otp: string, salt: string): string {
  return sha256Hex(`${salt}:${otp}`);
}

export function newOtpSecret(otp: string): { hash: string; salt: string } {
  const salt = safeRandomBytesHex(16);
  return { salt, hash: hashOtp(otp, salt) };
}

export function verifyOtpHash(otp: string, salt: string, expectedHash: string): boolean {
  const got = hashOtp(otp.trim(), salt);
  if (got.length !== expectedHash.length) return false;
  return safeTimingSafeEqual(got, expectedHash);
}

export function isPlausibleOtp(otp: string): boolean {
  return /^\d{4,6}$/.test(otp.trim());
}
