/**
 * OrderKing & KingPay Enterprise Systems
 * Merchant Statutory KYC & Identity Verification Engine
 * Invariants: Mathematical UIDAI Verhoeff Checksum, FSSAI Indian State Codes (01-38), GSTIN Assam (18)
 */
export interface VerificationResult {
  isValid: boolean;
  code: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}
// Mathematical UIDAI Verhoeff Checksum Tables
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const VERHOEFF_INV: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
export function validateAadhaarVerhoeff(aadhaar: string): VerificationResult {
  const sanitized = aadhaar.replace(/\s+/g, "");
  if (!/^\d{12}$/.test(sanitized)) {
    return { isValid: false, code: "INVALID_LENGTH", message: "Aadhaar must contain exactly 12 numeric digits" };
  }
  if (/^[01]/.test(sanitized)) {
    return { isValid: false, code: "INVALID_PREFIX", message: "Aadhaar cannot start with 0 or 1" };
  }
  let c = 0;
  const digits = sanitized.split("").map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  if (c !== 0) {
    return { isValid: false, code: "CHECKSUM_FAILED", message: "Aadhaar Verhoeff checksum validation failed" };
  }
  return {
    isValid: true,
    code: "VERIFIED",
    message: "Aadhaar mathematically verified",
    metadata: { masked: `XXXXXXXX${sanitized.slice(-4)}` }
  };
}
// 14-Digit FSSAI with Indian State Codes (01 to 38)
export function validateFSSAI(fssai: string): VerificationResult {
  const sanitized = fssai.trim();
  if (!/^\d{14}$/.test(sanitized)) {
    return { isValid: false, code: "INVALID_FORMAT", message: "FSSAI license must be exactly 14 digits" };
  }
  const licenseType = sanitized.slice(0, 1);
  const stateCode = parseInt(sanitized.slice(1, 3), 10);
  if (!["1", "2"].includes(licenseType)) {
    return { isValid: false, code: "INVALID_TYPE", message: "First digit must be 1 (Registration) or 2 (State/Central License)" };
  }
  if (stateCode < 1 || stateCode > 38) {
    return { isValid: false, code: "INVALID_STATE", message: `Invalid state code ${stateCode}. Must be between 01 and 38.` };
  }
  return {
    isValid: true,
    code: "VALID",
    message: "FSSAI structure valid",
    metadata: { licenseType: licenseType === "1" ? "Registration" : "State/Central License", stateCode }
  };
}
// 15-Digit GSTIN Verification (Assam jurisdiction: 18)
export function validateGSTIN(gstin: string): VerificationResult {
  const sanitized = gstin.trim().toUpperCase();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(sanitized)) {
    return { isValid: false, code: "INVALID_GSTIN_FORMAT", message: "Invalid 15-character GSTIN structure" };
  }
  const statePrefix = sanitized.slice(0, 2);
  return {
    isValid: true,
    code: "VALID_GSTIN",
    message: "GSTIN verified",
    metadata: { statePrefix, isAssamPlatformDefault: statePrefix === "18" }
  };
}
// Fast2SMS Quick Route 'q' OTP Request Payload
export interface Fast2SmsQuickPayload {
  authorization: string;
  route: "q";
  message: string;
  numbers: string;
  flash: 0;
}
export function buildFast2SmsOTPPayload(mobile: string, otp: string, apiKey: string): Fast2SmsQuickPayload {
  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  return {
    authorization: apiKey,
    route: "q",
    message: `Your OrderKing Partner verification OTP is ${otp}. Valid for 10 minutes. Do not share this code.`,
    numbers: cleanMobile,
    flash: 0,
  };
}
export function buildWhatsAppFailoverLink(_mobile: string, _otp: string): string {
  return "";
}
