import axios from 'axios';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Strips non-numeric characters and removes leading +91, 91, or 0.
 * Returns clean 10-digit Indian mobile number.
 */
export function sanitizeIndianPhone(input: string): string {
  return (input || '').replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '').slice(-10);
}

/**
 * Validates that the number is exactly 10 digits starting with 6, 7, 8, or 9.
 */
export function isValidIndianPhone(cleanPhone: string): boolean {
  return /^[6-9]\d{9}$/.test(cleanPhone);
}

/**
 * Cryptographically generates a secure 6-digit numeric OTP.
 */
export function generateOtp(length = 6): string {
  const n = 10 ** length;
  const min = 10 ** (length - 1);
  if (typeof crypto !== 'undefined' && crypto.randomInt) {
    return String(crypto.randomInt(min, n));
  }
  return String(Math.floor(min + Math.random() * (n - min)));
}

// ---------------------------------------------------------------------------
// Rate Limiter: Max 3 OTP attempts per phone per 10 minutes
// ---------------------------------------------------------------------------
interface PhoneRateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, PhoneRateLimitRecord>();

export function checkRateLimit(cleanPhone: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const tenMinutesMs = 10 * 60 * 1000;
  const record = rateLimitStore.get(cleanPhone) || { timestamps: [] };

  // Retain only attempts within the rolling 10-minute window
  const recent = record.timestamps.filter((ts) => now - ts < tenMinutesMs);
  rateLimitStore.set(cleanPhone, { timestamps: recent });

  if (recent.length >= 3) {
    const oldestAttempt = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestAttempt + tenMinutesMs - now) / 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: 3 - recent.length,
  };
}

export function recordOtpAttempt(cleanPhone: string): void {
  const now = Date.now();
  const tenMinutesMs = 10 * 60 * 1000;
  const record = rateLimitStore.get(cleanPhone) || { timestamps: [] };
  const recent = record.timestamps.filter((ts) => now - ts < tenMinutesMs);
  recent.push(now);
  rateLimitStore.set(cleanPhone, { timestamps: recent });
}

export function resetRateLimit(cleanPhone: string): void {
  rateLimitStore.delete(cleanPhone);
}

// ---------------------------------------------------------------------------
// OTP In-Memory Storage: 5-minute expiration
// ---------------------------------------------------------------------------
export interface OtpSessionEntry {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

const otpSessionCache = new Map<string, OtpSessionEntry>();

export function storeOtp(cleanPhone: string, otp: string, ttlMs = 5 * 60 * 1000): void {
  otpSessionCache.set(cleanPhone, {
    phone: cleanPhone,
    otp,
    expiresAt: Date.now() + ttlMs, // 5 minutes
    attempts: 0,
  });
}

export function getStoredOtp(cleanPhone: string): OtpSessionEntry | undefined {
  const entry = otpSessionCache.get(cleanPhone);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    otpSessionCache.delete(cleanPhone);
    return undefined;
  }
  return entry;
}

export function clearStoredOtp(cleanPhone: string): void {
  otpSessionCache.delete(cleanPhone);
}

/**
 * Primary OTP Provider: Fast2SMS modern Bulk V2 OTP API
 * Official Endpoint: POST https://www.fast2sms.com/dev/bulkV2
 * Route: 'otp' with fallback to route 'q' (Quick SMS) if website verification is pending (error 996)
 */
export async function sendOtpFast2SMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = (process.env.FAST2SMS_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey || apiKey === 'xxx' || apiKey.includes('change-me')) {
    throw new Error('FAST2SMS_API_KEY not set');
  }

  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) {
    throw new Error(`Invalid Indian mobile number: ${phone}. Must be a 10-digit number starting with 6, 7, 8, or 9.`);
  }

  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();
  if (!cleanOtp) {
    throw new Error('OTP code is required');
  }

  // Branch 1: Try official Fast2SMS route 'otp'
  const otpPayload = {
    route: 'otp',
    variables_values: cleanOtp,
    numbers: cleanPhone,
  };

  try {
    const resp = await axios.post('https://www.fast2sms.com/dev/bulkV2', otpPayload, {
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    if (resp.data?.return) {
      console.log(`[Telecom Gateway] Fast2SMS OTP delivered successfully to +91-${cleanPhone} (Request ID: ${resp.data?.request_id || 'N/A'})`);
      return true;
    }

    // If route 'otp' returned false or error status, inspect message
    const msg = Array.isArray(resp.data?.message) ? resp.data.message.join(', ') : String(resp.data?.message || '');
    console.warn(`[Telecom Gateway] Fast2SMS route 'otp' non-success: ${msg}. Attempting fallback route 'q'...`);
  } catch (err: unknown) {
    const respData = (err as any)?.response?.data;
    const statusCode = respData?.status_code;
    const msg = Array.isArray(respData?.message) ? respData.message.join(', ') : String(respData?.message || (err as any)?.message || err);

    // Error 996: Before using OTP Message API, complete website verification.
    // Seamlessly fall back to Quick SMS route ('q') so delivery succeeds immediately!
    console.warn(`[Telecom Gateway] Fast2SMS route 'otp' failed (Status ${statusCode || 'ERR'}: ${msg}). Attempting Quick SMS corridor ('q')...`);
  }

  // Branch 2: Fast2SMS Quick Transactional SMS Route ('q') fallback
  try {
    const quickPayload = {
      route: 'q',
      message: `Your OrderKing verification code is ${cleanOtp}. Valid for 5 minutes. Do not share with anyone.`,
      language: 'english',
      numbers: cleanPhone,
    };

    const qResp = await axios.post('https://www.fast2sms.com/dev/bulkV2', quickPayload, {
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    if (qResp.data?.return) {
      console.log(`[Telecom Gateway] Fast2SMS Quick SMS delivered successfully to +91-${cleanPhone} (Request ID: ${qResp.data?.request_id || 'N/A'})`);
      return true;
    }

    const qMsg = Array.isArray(qResp.data?.message) ? qResp.data.message.join(', ') : String(qResp.data?.message || '');
    console.error(`[Telecom Gateway] Fast2SMS Quick SMS rejected: ${qMsg}`);
    return false;
  } catch (qErr: unknown) {
    const qErrMsg = (qErr as any)?.response?.data?.message || (qErr as any)?.message || String(qErr);
    console.error('[Telecom Gateway] Fast2SMS Quick SMS route failed:', qErrMsg);
    return false;
  }
}

/**
 * Fallback OTP Provider: 2Factor.in Official Transactional Gateway
 * Official Endpoint: https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/{OTP}/AUTOGEN
 *
 * Guard: If TWOFACTOR_API_KEY === FAST2SMS_API_KEY, recognize duplicate key and gracefully skip
 * to prevent gateway rejection.
 */
export async function sendOtp2Factor(phone: string, otp: string): Promise<boolean> {
  { const _f2sCheck = (process.env.FAST2SMS_API_KEY || "").trim();
  const _tfCheck = (process.env.OTP_2FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || "").trim();
  if (!_tfCheck || _tfCheck === _f2sCheck || _tfCheck.length > 45) {
    console.info("[OTP] Skipping 2Factor fallback because OTP_2FACTOR_API_KEY matches FAST2SMS_API_KEY or is not a distinct 2Factor UUID.");
    return false;
  } }
  const f2sKey = (process.env.FAST2SMS_API_KEY || "").trim();
  const tfKey = (process.env.OTP_2FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || "").trim();
  if (!tfKey || tfKey === f2sKey || tfKey.length > 45) {
    console.info("[OTP] Skipping 2Factor fallback because OTP_2FACTOR_API_KEY matches FAST2SMS_API_KEY or is not a distinct 2Factor UUID.");
    return false;
  }
  const f2sKey = (process.env.FAST2SMS_API_KEY || "").trim();
  const tfKey = (process.env.OTP_2FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || "").trim();
  if (!tfKey || tfKey === f2sKey || tfKey.length > 45) {
    console.info("[OTP] Skipping 2Factor fallback because OTP_2FACTOR_API_KEY matches FAST2SMS_API_KEY or is not a distinct 2Factor UUID.");
    return false;
  }
  const apiKey = (
    process.env.TWOFACTOR_API_KEY ||
    process.env.TWO_FACTOR_API_KEY ||
    process.env.OTP_2FACTOR_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');
  const fast2SmsKey = (process.env.FAST2SMS_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'xxx' || apiKey.includes('change-me') || apiKey.includes('your_2factor')) {
    console.warn('[Telecom Gateway] 2Factor API key not configured or placeholder; skipping 2Factor.');
    return false;
  }

  // Gracefully skip if 2Factor key matches Fast2SMS key (they are different services)
  if (fast2SmsKey && apiKey === fast2SmsKey) {
    console.warn(
      '[Telecom Gateway] OTP_2FACTOR_API_KEY matches FAST2SMS_API_KEY. ' +
      '2Factor.in is not independently configured with its own UUID key. Skipping 2Factor fallback to prevent gateway failure.'
    );
    return false;
  }

  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) {
    console.warn(`[Telecom Gateway] Invalid Indian mobile number for 2Factor: ${phone}`);
    return false;
  }

  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();
  if (!cleanOtp) {
    console.warn('[Telecom Gateway] Empty OTP for 2Factor dispatch');
    return false;
  }

  const template = (process.env.TWOFACTOR_OTP_TEMPLATE || 'AUTOGEN').trim();
  const url = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${cleanPhone}/${encodeURIComponent(cleanOtp)}/${encodeURIComponent(template)}`;

  try {
    const resp = await axios.get(url, {
      headers: { Accept: 'application/json' },
      timeout: 8000,
    });
    return resp.data?.Status === 'Success';
  } catch (err: unknown) {
    const errMsg = (err as any)?.response?.data?.Details || (err as any)?.message || String(err);
    console.error('[Telecom Gateway] 2Factor error:', errMsg);
    return false;
  }
}

/**
 * 2Factor Official Voice OTP Dispatcher
 * Official Endpoint: https://2factor.in/API/V1/{API_KEY}/VOICE/{PHONE}/{OTP}
 */
export async function sendVoiceOtp2Factor(phone: string, otp: string): Promise<boolean> {
  { const _f2sCheck = (process.env.FAST2SMS_API_KEY || "").trim();
  const _tfCheck = (process.env.OTP_2FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || "").trim();
  if (!_tfCheck || _tfCheck === _f2sCheck || _tfCheck.length > 45) {
    return false;
  } }
  const f2sKey = (process.env.FAST2SMS_API_KEY || "").trim();
  const tfKey = (process.env.OTP_2FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || "").trim();
  if (!tfKey || tfKey === f2sKey || tfKey.length > 45) {
    return false;
  }
  const f2sKey = (process.env.FAST2SMS_API_KEY || "").trim();
  const tfKey = (process.env.OTP_2FACTOR_API_KEY || process.env.TWOFACTOR_API_KEY || "").trim();
  if (!tfKey || tfKey === f2sKey || tfKey.length > 45) {
    return false;
  }
  const apiKey = (
    process.env.TWOFACTOR_API_KEY ||
    process.env.TWO_FACTOR_API_KEY ||
    process.env.OTP_2FACTOR_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');
  const fast2SmsKey = (process.env.FAST2SMS_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'xxx' || apiKey.includes('change-me')) {
    console.warn('[Telecom Gateway] 2Factor API key not configured for voice OTP dispatch.');
    return false;
  }

  if (fast2SmsKey && apiKey === fast2SmsKey) {
    console.warn('[Telecom Gateway] Skipping 2Factor voice: API key matches Fast2SMS key.');
    return false;
  }

  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) return false;
  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();
  if (!cleanOtp) return false;

  const voiceUrl = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/VOICE/${cleanPhone}/${encodeURIComponent(cleanOtp)}`;

  try {
    const resp = await axios.get(voiceUrl, {
      headers: { Accept: 'application/json' },
      timeout: 8000,
    });
    return resp.data?.Status === 'Success';
  } catch (err: unknown) {
    const errMsg = (err as any)?.response?.data?.Details || (err as any)?.message || String(err);
    console.error('[Telecom Gateway] 2Factor voice error:', errMsg);
    return false;
  }
}

/**
 * Tertiary OTP Provider: MSG91 OTP API
 */
export async function sendOtpMSG91(phone: string, otp: string): Promise<boolean> {
  const authKey = (process.env.MSG91_AUTH_KEY || '').trim().replace(/^["']|["']$/g, '');
  const templateId = (process.env.MSG91_TEMPLATE_ID || '').trim();
  if (!authKey || authKey === 'xxx' || authKey.includes('change-me') || !templateId) {
    return false;
  }
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) return false;
  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();

  try {
    const resp = await axios.post(
      `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=91${cleanPhone}&authkey=${encodeURIComponent(authKey)}&otp=${encodeURIComponent(cleanOtp)}`,
      {},
      { timeout: 8000 }
    );
    return resp.data?.type === 'success';
  } catch (err: unknown) {
    console.error('[Telecom Gateway] MSG91 error:', (err as any)?.message || err);
    return false;
  }
}

/**
 * Master Telecom OTP Dispatcher.
 * Priority Order:
 * 1. PRIMARY: Fast2SMS (Bulk V2 OTP / Quick SMS) — Active live gateway
 * 2. FALLBACK 1: 2Factor.in (Skipped gracefully if key matches Fast2SMS key)
 * 3. FALLBACK 2: MSG91
 *
 * Zero mocks: Real API calls only. If all gateways fail or are unconfigured,
 * returns { success: false } with clear error diagnostics.
 */
export async function sendOtp(phone: string, otp: string): Promise<{
  success: boolean;
  provider: 'fast2sms' | '2factor' | 'msg91' | null;
  message?: string;
  error?: string;
}> {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
  }

  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error('OTP code must be exactly 6 digits.');
  }

  // 1. PRIMARY: Fast2SMS modern Bulk V2
  try {
    const fast2smsOk = await sendOtpFast2SMS(cleanPhone, cleanOtp);
    if (fast2smsOk) {
      return {
        success: true,
        provider: 'fast2sms',
        message: `OTP delivered via Fast2SMS to +91-${cleanPhone}`,
      };
    }
  } catch (err: unknown) {
    console.warn('[Telecom Gateway] Fast2SMS primary failed, checking fallback:', (err as any)?.message || err);
  }

  // 2. FALLBACK 1: 2Factor.in (checked for duplicate key guard)
  const fast2SmsKey = (process.env.FAST2SMS_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const twoFactorKey = (
    process.env.TWOFACTOR_API_KEY ||
    process.env.TWO_FACTOR_API_KEY ||
    process.env.OTP_2FACTOR_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  if (twoFactorKey && twoFactorKey !== fast2SmsKey && !twoFactorKey.includes('change-me') && twoFactorKey !== 'xxx') {
    try {
      const twoFactorOk = await sendOtp2Factor(cleanPhone, cleanOtp);
      if (twoFactorOk) {
        return {
          success: true,
          provider: '2factor',
          message: `OTP delivered via 2Factor fallback to +91-${cleanPhone}`,
        };
      }
    } catch (err: unknown) {
      console.warn('[Telecom Gateway] 2Factor fallback failed:', (err as any)?.message || err);
    }
  } else if (twoFactorKey && twoFactorKey === fast2SmsKey) {
    console.warn('[Telecom Gateway] 2Factor fallback skipped: OTP_2FACTOR_API_KEY matches FAST2SMS_API_KEY.');
  }

  // 3. FALLBACK 2: MSG91
  try {
    const msg91Ok = await sendOtpMSG91(cleanPhone, cleanOtp);
    if (msg91Ok) {
      return {
        success: true,
        provider: 'msg91',
        message: `OTP delivered via MSG91 fallback to +91-${cleanPhone}`,
      };
    }
  } catch (err: unknown) {
    console.warn('[Telecom Gateway] MSG91 fallback failed:', (err as any)?.message || err);
  }

  // Zero Mocks: Fail honestly when no gateway could deliver SMS
  const failureMsg = `All telecom SMS gateways failed to deliver OTP to +91-${cleanPhone}.`;
  console.error(`[Telecom Gateway] ${failureMsg}`);
  return {
    success: false,
    provider: null,
    error: failureMsg,
  };
}

/**
 * Complete End-to-End OTP Generation & Request Handler.
 * Enforces:
 * - 6-digit random code
 * - Max 3 attempts per phone per 10 minutes rate limit
 * - 5-minute expiration
 * - Fast2SMS primary dispatch
 */
export async function requestOtp(phone: string): Promise<{
  success: boolean;
  phone: string;
  provider: string | null;
  message: string;
  expiresInSeconds: number;
}> {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
  }

  // Rate limit: max 3 attempts per phone per 10 minutes
  const rateLimit = checkRateLimit(cleanPhone);
  if (!rateLimit.allowed) {
    throw new Error(
      `Too many OTP requests. Maximum 3 attempts per 10 minutes. Please try again in ${rateLimit.retryAfterSeconds ?? 60} seconds.`
    );
  }

  // Record attempt in rate limiter
  recordOtpAttempt(cleanPhone);

  // Generate 6-digit OTP
  const otp = generateOtp(6);

  // Store in cache with 5-minute expiry (300 seconds)
  storeOtp(cleanPhone, otp, 5 * 60 * 1000);

  // Dispatch via Fast2SMS primary (with fallback)
  const dispatch = await sendOtp(cleanPhone, otp);
  if (!dispatch.success) {
    throw new Error(dispatch.error || 'Failed to deliver SMS OTP. Please check mobile network.');
  }

  return {
    success: true,
    phone: cleanPhone,
    provider: dispatch.provider,
    message: `OTP sent successfully to +91-${cleanPhone}. Valid for 5 minutes.`,
    expiresInSeconds: 300,
  };
}

/**
 * Complete End-to-End OTP Verification Handler.
 * Enforces:
 * - 6-digit code format
 * - 5-minute expiration check
 * - Single-use deletion on match
 */
export function verifyOtp(phone: string, enteredCode: string): {
  verified: boolean;
  phone: string;
  message: string;
} {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }

  const cleanCode = String(enteredCode || '').replace(/\D/g, '').trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error('Please enter a valid 6-digit verification code.');
  }

  const record = getStoredOtp(cleanPhone);
  if (!record) {
    throw new Error('Verification code has expired or was not requested. Please request a new OTP.');
  }

  if (Date.now() > record.expiresAt) {
    clearStoredOtp(cleanPhone);
    throw new Error('Verification code has expired (5-minute limit). Please request a new OTP.');
  }

  if (record.otp !== cleanCode) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      clearStoredOtp(cleanPhone);
      throw new Error('Maximum incorrect verification attempts exceeded. Please request a new OTP.');
    }
    throw new Error('Invalid verification code. Please check the code and try again.');
  }

  // Clear OTP on successful verification (single-use)
  clearStoredOtp(cleanPhone);

  return {
    verified: true,
    phone: cleanPhone,
    message: 'Phone number verified successfully.',
  };
}
