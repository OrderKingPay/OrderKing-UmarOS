import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createServerFn } from "@tanstack/react-start";
import { newId } from "@/lib/ids";
import { loadConfig } from "@/lib/server/load-config";

export const getKingpayBalance = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }: any) => {
    try {
      const sql = await getSql();
      const rows = await sql<{ balance_paise: number; king_coins: number }>`
        SELECT balance_paise, king_coins FROM kingpay_wallets WHERE user_id = ${context.userId}
      `;
      if (rows.length === 0) {
        await sql`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${context.userId}, 0, 0) ON CONFLICT DO NOTHING`;
        return { balance: 0, coins: 0 };
      }
      return { balance: rows[0].balance_paise / 100, coins: Number(rows[0].king_coins) };
    } catch (err) {
      console.error("getKingpayBalance failed:", err);
      return { balance: 0, coins: 0 };
    }
  });

export const addKingpayMoney = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    amount: number;
    description: string;
    gatewaySignature?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => d)
  .handler(async ({ context, data }: any) => {
    if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("Financial Security: Credit amount must be a positive finite number.");
    }

    const { getRazorpayConfig, verifyRazorpaySignature } = await import("./razorpay.server");
    const rzpConfig = getRazorpayConfig();

    if (data.razorpayOrderId && data.razorpayPaymentId && data.razorpaySignature) {
      if (!rzpConfig.hasCredentials || !rzpConfig.keySecret) {
        throw new Error("Financial Security: Payment provider unconfigured. Cannot verify top-up.");
      }
      const isValid = verifyRazorpaySignature({
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
      });
      if (!isValid) {
        throw new Error("Financial Security: Razorpay signature verification failed. Top-up rejected.");
      }
    } else if (data.gatewaySignature && typeof data.gatewaySignature === "string" && data.gatewaySignature.trim().length >= 16) {
      const cfg = await loadConfig();
      if (cfg.marketplace.launchMode === "live") {
        throw new Error("Financial Security: Online gateway verification required in live mode.");
      }
    } else {
      throw new Error("Financial Security: Valid gateway signature required to top up wallet.");
    }

    if (data.amount > 100000) {
      throw new Error("Financial Security: Maximum single top-up limit is ₹1,00,000.");
    }

    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    if (amountPaise <= 0) {
      throw new Error("Financial Security: Credit amount in paise must be positive.");
    }

    await sql.transaction(async (tx) => {
      await tx`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${context.userId}, 0, 0) ON CONFLICT DO NOTHING`;
      await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise + ${amountPaise}, updated_at = NOW() WHERE user_id = ${context.userId}`;
      await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${newId("kptx")}, ${context.userId}, ${amountPaise}, 'CREDIT', ${data.description})`;
    });
    return { success: true };
  });

export const deductKingpayMoney = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { amount: number; description: string }) => d)
  .handler(async ({ context, data }: any) => {
    if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("Financial Security: Deduction amount must be a positive finite number.");
    }

    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    if (amountPaise <= 0) {
      throw new Error("Financial Security: Deduction amount in paise must be positive.");
    }

    return await sql.transaction(async (tx) => {
      const rows = await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${context.userId} FOR UPDATE
      `;
      const current = rows[0]?.balance_paise ?? 0;
      if (current < amountPaise) {
        throw new Error("Insufficient KingPay balance");
      }
      await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise - ${amountPaise}, updated_at = NOW() WHERE user_id = ${context.userId}`;
      await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${newId("kptx")}, ${context.userId}, ${amountPaise}, 'DEBIT', ${data.description})`;
      return { success: true };
    });
  });

