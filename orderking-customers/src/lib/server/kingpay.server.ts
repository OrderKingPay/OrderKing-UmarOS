
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

export const addKingpayMoney = createServerFn({ method: "POST" })
  .inputValidator((d: { amount: number; description: string }) => d)
  .handler(async () => {
    throw new Error("KingPay balance top-up is unavailable until a real payment provider and verified webhook/reconciliation flow are connected.");
  });

export const deductKingpayMoney = createServerFn({ method: "POST" })
  .inputValidator((d: { amount: number; description: string }) => d)
  .handler(async () => {
    throw new Error("KingPay balance spending is unavailable until a real provider-backed balance is enabled.");
  });
