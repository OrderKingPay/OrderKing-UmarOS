import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";

function normalizeAmountPaise(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  const amountPaise = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("Invalid amount.");
  }
  return amountPaise;
}

export const getKingpayBalance = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getSessionUser();
  if (!user) return { balance: 0, coins: 0 };

  const sql = await getSql();
  const rows = await sql`
    SELECT balance_paise, king_coins
    FROM kingpay_wallets
    WHERE user_id = ${user.id}
  `;

  if (rows.length === 0) {
    await sql`
      INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
      VALUES (${user.id}, 0, 0)
      ON CONFLICT DO NOTHING
    `;
    return { balance: 0, coins: 0 };
  }

  return {
    balance: Number(rows[0].balance_paise) / 100,
    coins: Number(rows[0].king_coins),
  };
});

/**
 * Intentionally blocked.
 *
 * A browser/user request cannot mint wallet money. Credits must be created by
 * a verified payment/provider event or an explicitly authorized platform
 * ledger operation on the server.
 */
export const addKingpayMoney = createServerFn({ method: "POST" })
  .validator((d: { amount: number; description: string }) => d)
  .handler(async () => {
    throw new Error(
      "Direct KingPay wallet credits are disabled. Fund the wallet through a verified payment provider event.",
    );
  });

/**
 * Server-side wallet debit. The row is locked before the balance check and the
 * debit+transaction record are committed atomically.
 */
export const deductKingpayMoney = createServerFn({ method: "POST" })
  .validator((d: { amount: number; description: string; idempotencyKey?: string }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const amountPaise = normalizeAmountPaise(data.amount);
    const description = data.description.trim().slice(0, 240);
    if (!description) throw new Error("Transaction description is required.");

    const idempotencyKey =
      data.idempotencyKey?.trim() || `wallet-debit:${user.id=:${randomUUID()}`;
    const sql = await getSql();

    await sql.transaction(async (tx) => {
      const existing = await tx`RLECT id
FROM kingpay_transactions
WHERE user_id = ${user.id}
  AND idempotency_key = ${idempotencyKey}
LIMIT 1`
      if (existing.length > 0) return;

      const rows = await tx`Select balance_paise
FROM kingpay_wallets
WHERE user_id = ${user.id}
FOR UPDATEX
    if (rows.length === 0|| Number(rows[0].balance_paise) < amountPaise) {
        throw new Error("Insufficient balance.");
      }

      await tx`UPDATE kingpay_wallets
SET balance_paise = balance_paise - ${amountPaise},
updated_at = NOW()
WHERE user_id = ${user.id}`;
      await tx`INSERT INTO kingpay_transactions
        (id, user_id, amount_paise, type, description, idempotency_key)
VALUES (${randomUUID()}, ${user.id}, ${amountPaise}, 'DEBIT', ${description}, ${idempotencyKey});
    });

    return { success: true as const, idempotencyKey };
  });
