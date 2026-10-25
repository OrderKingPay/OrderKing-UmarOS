/**
 * OrderKing Customer Phone Authentication & SMS OTP Server Functions
 *
 * Implements real telecom OTP delivery via Fast2SMS / 2Factor / WhatsApp,
 * secure OTP verification with database and in-memory persistence, and
 * seamless bridge to Better Auth sessions.
 */

import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "node:crypto";
import { getSql } from "../db";
import {
  sanitizeIndianPhone,
  isValidIndianPhone,
  dispatchOtpSms,
  type DispatchOtpResult,
} from "./sms-gateway";

interface OtpCacheEntry {
  otp: string;
  phone: string;
  expiresAt: number;
}

// In-memory cache for ultra-fast OTP verification with zero database round-trip dependency
const memoryOtpCache = new Map<string, OtpCacheEntry>();

function cleanExpiredMemoryOtps(): void {
  const now = Date.now();
  for (const [key, entry] of memoryOtpCache.entries()) {
    if (entry.expiresAt < now) {
      memoryOtpCache.delete(key);
    }
  }
}

/**
 * 1. Dispatch OTP to the customer's phone via SMS or WhatsApp
 */
export const requestPhoneOtpFn = createServerFn({ method: "POST" })
  .validator((input: { phone: string; channel?: "sms" | "whatsapp"; name?: string }) => input)
  .handler(async ({ data }) => {
    cleanExpiredMemoryOtps();
    const cleanPhone = sanitizeIndianPhone(data.phone);

    if (!isValidIndianPhone(cleanPhone)) {
      throw new Error("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
    }

    // Generate cryptographically secure 6-digit OTP
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const otp = (100000 + (randomBuffer[0] % 900000)).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 1. Cache in memory
    memoryOtpCache.set(`phone:${cleanPhone}`, {
      otp,
      phone: cleanPhone,
      expiresAt,
    });

    // 2. Persist in database verification table
    try {
      const sql = await getSql();
      const otpId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      
      // Ensure verification table exists
      await sql`
        CREATE TABLE IF NOT EXISTS verification (
          id TEXT NOT NULL PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `;

      // Clear existing active tokens for this phone
      await sql`DELETE FROM verification WHERE identifier = ${`phone:${cleanPhone}`}`;

      // Insert fresh verification record
      await sql`
        INSERT INTO verification (id, identifier, value, "expiresAt")
        VALUES (${otpId}, ${`phone:${cleanPhone}`}, ${otp}, NOW() + INTERVAL '10 minutes')
      `;
    } catch (dbErr) {
      console.warn("[Phone Auth] DB verification write skipped (in-memory cache active):", dbErr);
    }

    // 3. Dispatch via live telecom gateway (Fast2SMS / 2Factor / WhatsApp)
    let dispatchResult: DispatchOtpResult;
    try {
      dispatchResult = await dispatchOtpSms({
        phone: cleanPhone,
        otp,
        channel: data.channel || "sms",
        appName: "OrderKing",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Phone Auth] Dispatch exception:", msg);
      throw new Error(`Failed to send SMS: ${msg}`);
    }

    return {
      success: true,
      phone: cleanPhone,
      provider: dispatchResult.provider,
      messageId: dispatchResult.messageId,
      whatsAppOtpUrl: dispatchResult.whatsAppOtpUrl,
      providerNotice: dispatchResult.providerNotice,
      // In development or when gateway is in simulated/fallback mode, surface debugOtp
      debugOtp: dispatchResult.provider === "resilient_fallback" ? dispatchResult.debugOtp : undefined,
    };
  });

/**
 * 2. Verify OTP and return deterministic credentials for Better Auth session
 */
export const verifyPhoneOtpFn = createServerFn({ method: "POST" })
  .validator((input: { phone: string; otp: string }) => input)
  .handler(async ({ data }) => {
    cleanExpiredMemoryOtps();
    const cleanPhone = sanitizeIndianPhone(data.phone);
    const enteredOtp = (data.otp || "").trim();

    if (!isValidIndianPhone(cleanPhone)) {
      throw new Error("Invalid mobile number format.");
    }

    if (!/^\d{6}$/.test(enteredOtp)) {
      throw new Error("Please enter a valid 6-digit OTP code.");
    }

    let isValid = false;
    const cacheKey = `phone:${cleanPhone}`;

    // 1. Check in-memory store
    const memEntry = memoryOtpCache.get(cacheKey);
    if (memEntry && memEntry.otp === enteredOtp && memEntry.expiresAt > Date.now()) {
      isValid = true;
      memoryOtpCache.delete(cacheKey);
    }

    // 2. Check database verification table if not verified via memory
    if (!isValid) {
      try {
        const sql = await getSql();
        const rows = await sql<{ id: string; value: string; expiresAt: string }>`
          SELECT id, value, "expiresAt"
          FROM verification
          WHERE identifier = ${cacheKey}
            AND value = ${enteredOtp}
            AND "expiresAt" > NOW()
          ORDER BY "createdAt" DESC
          LIMIT 1
        `;

        if (rows.length > 0) {
          isValid = true;
          // Consume OTP
          await sql`DELETE FROM verification WHERE id = ${rows[0].id}`;
        }
      } catch (dbErr) {
        console.warn("[Phone Auth] DB verification query failed:", dbErr);
      }
    }

    if (!isValid) {
      throw new Error("Invalid or expired OTP. Please check the code or request a new one.");
    }

    // 3. Derive deterministic Better Auth credentials
    const authSecret = process.env.BETTER_AUTH_SECRET || "orderking_phone_salt_v1_2026";
    const hash = createHmac("sha256", authSecret).update(cleanPhone).digest("hex");
    const derivedPassword = `OK_${hash.slice(0, 20)}!9A`;
    const syntheticEmail = `${cleanPhone}@phone.orderkingpay.com`;

    return {
      success: true,
      verified: true,
      phone: cleanPhone,
      email: syntheticEmail,
      password: derivedPassword,
    };
  });
