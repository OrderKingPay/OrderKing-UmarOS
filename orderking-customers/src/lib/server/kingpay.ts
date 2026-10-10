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
  .validator((d: { amount: number; description: string; gatewaySignature?: string }) => d)
  .handler(async ({ context, data }: any) => {
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
    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);

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
