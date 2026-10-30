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

    const userId = "usr_" + hash.slice(0, 16);
  const now = new Date().toISOString();
  const profile = {
    id: userId,
    phone: cleanPhone,
    email: syntheticEmail,
    name: "OrderKing " + cleanPhone.slice(-4),
    role: "customer",
    phoneVerified: true,
    kingpayBalancePaise: 0,
    updatedAt: now,
  };

  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey) {
    try {
      await fetch(sbUrl + "/rest/v1/profiles", {
        method: "POST",
        headers: {
          apikey: sbKey,
          Authorization: "Bearer " + sbKey,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          id: userId,
          phone: cleanPhone,
          email: syntheticEmail,
          full_name: profile.name,
          role: "customer",
          phone_verified: true,
          updated_at: now,
        }),
      });
    } catch (err) {
      console.warn("[OrderKing-Auth] Supabase profile upsert warning:", err);
    }
  }

  return {
    success: true,
    verified: true,
    userId,
    phone: cleanPhone,
    email: syntheticEmail,
    password: derivedPassword,
    profile,
  };
  });



