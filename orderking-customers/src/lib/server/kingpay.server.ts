
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";

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

export const listKingpayTransactions = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getSessionUser();
  if (!user) return [];
  const sql = await getSql();
  return await sql<{ id: string; amount_paise: number; type: string; description: string; created_at: string }>`
    SELECT id, amount_paise, type, description, created_at::text AS created_at
    FROM kingpay_transactions
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 100
  `;
});

export const addKingpayMoney = createServerFn({ method: "POST" })
  .validator((data: { amount: number; description: string }) => data)
  .handler(async () => {
    throw new Error("DIRECT_WALLET_CREDIT_DISABLED: Wallet credits must come from a verified payment or rewards provider callback.");
  });

export const deductKingpayMoney = createServerFn({ method: "POST" })
  .validator((data: { amount: number; description: string }) => data)
  .handler(async () => {
    throw new Error("DIRECT_WALLET_DEBIT_DISABLED: Wallet debits must be executed by a verified transaction flow.");
  });
