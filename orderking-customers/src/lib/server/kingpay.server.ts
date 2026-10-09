import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { loadConfig } from "@/lib/server/load-config";

export const getKingpayBalance = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const user = await getSessionUser();
    if (!user) return { balance: 0, coins: 0 };
    const sql = await getSql();
    const rows = await sql<{ balance_paise: number; king_coins: number }>`
      SELECT balance_paise, king_coins FROM kingpay_wallets WHERE user_id = ${user.id}
    `;
    if (rows.length === 0) {
      await sql`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${user.id}, 0, 0) ON CONFLICT DO NOTHING`;
      return { balance: 0, coins: 0 };
    }
    return { balance: rows[0].balance_paise / 100, coins: Number(rows[0].king_coins) };
  } catch (err) {
    console.error("getKingpayBalance failed:", err);
    return { balance: 0, coins: 0 };
  }
});

export const addKingpayMoney = createServerFn({ method: "POST" })
  .validator((d: { amount: number; description: string; gatewaySignature?: string }) => d)
  .handler(async ({ data }: any) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");
    
    const cfg = await loadConfig();
    
    if (cfg.marketplace.launchMode === "live") {
       if (!data.gatewaySignature) {
           throw new Error("Financial Security: Payment gateway signature missing. Unauthorized minting blocked.");
       }
       throw new Error("Financial Security: Live payment gateways are pending legal/provider authorization. Minting blocked.");
    }
    
    if (data.amount > 10000) {
        throw new Error("Sandbox Security: Maximum test transaction limit exceeded.");
    }

    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    
    await sql.transaction(async (tx) => {
      await tx`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${user.id}, 0, 0) ON CONFLICT DO NOTHING`;
      await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise + ${amountPaise}, updated_at = NOW() WHERE user_id = ${user.id}`;
      await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${randomUUID()}, ${user.id}, ${amountPaise}, 'CREDIT', ${data.description})`;
    });
    return { success: true };
  });

export const deductKingpayMoney = createServerFn({ method: "POST" })
  .validator((d: { amount: number; description: string }) => d)
  .handler(async ({ data }: any) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");
    
    const cfg = await loadConfig();
    
    if (cfg.marketplace.launchMode === "live") {
       throw new Error("Financial Security: Wallet deductions require backend cryptographic validation in live mode.");
    }

    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    
    await sql.transaction(async (tx) => {
      const rows = await tx<{ balance_paise: number }>`SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${user.id} FOR UPDATE`;
      if (rows.length === 0 || rows[0].balance_paise < amountPaise) {
        throw new Error("Insufficient Balance");
      }
      await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise - ${amountPaise}, updated_at = NOW() WHERE user_id = ${user.id}`;
      await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${randomUUID()}, ${user.id}, ${amountPaise}, 'DEBIT', ${data.description})`;
    });
    return { success: true };
  });
