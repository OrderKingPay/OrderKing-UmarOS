import { createHash } from "node:crypto";
import { getSql } from "../db.ts";
import Razorpay from "razorpay";
import { z } from "zod";

function getRazorpayClient(): Razorpay {
  const mode = (process.env.RAZORPAY_MODE ?? "live").trim().toLowerCase();
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured.");
  }
  if (keyId === "test_key" || keySecret === "test_secret") {
    throw new Error("Placeholder Razorpay credentials are forbidden.");
  }

  const isTestKey = keyId.startsWith("rzp_test_");
  if (mode === "live" && isTestKey) {
    throw new Error("Live Razorpay mode refuses test credentials.");
  }
  if (mode === "sandbox" && !isTestKey) {
    throw new Error("Sandbox Razorpay mode requires an rzp_test_ key.");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function transactionId(idempotencyKey: string): string {
  return `kp_${createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 56)}`;
}

export const TopUpSchema = z.object({
  customerId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string().min(1),
});

export const walletEngine = {
  async getBalance(customerId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ balance_paise: number }>`
      SELECT balance_paise
      FROM kingpay_wallets
      WHERE user_id = ${customerId}
    `;
    return Number(result[0]?.balance_paise ?? 0);
  },

  async createTopUpOrder(input: z.infer<typeof TopUpSchema>) {
    const data = TopUpSchema.parse(input);
    const razorpay = getRazorpayClient();
    return razorpay.orders.create({
      amount: data.amountPaise,
      currency: "INR",
      receipt: `topup_${data.customerId}_${Date.now()}`,
      notes: {
        customerId: data.customerId,
        idempotencyKey: data.idempotencyKey,
        purpose: "KINGPAY_WALLET_TOPUP",
      },
    });
  },

  async creditWallet(customerId: string, amountPaise: number, idempotencyKey: string) {
    if (!customerId || !Number.isInteger(amountPaise) || amountPaise <= 0 || !idempotencyKey) {
      throw new Error("Invalid wallet credit request");
    }

    const sql = await getSql();
    const txId = transactionId(idempotencyKey);

    return await sql.transaction(async (tx) => {
      const existing = await tx<{ id: string }>`
        SELECT id FROM kingpay_transactions WHERE id = ${txId}
      `;
      if (existing.length > 0) return { status: "already_processed", transactionId: txId };

      await tx`
        INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
        VALUES (${customerId}, 0, 0)
        ON CONFLICT (user_id) DO NOTHING
      `;

      await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_wallets
        WHERE user_id = ${customerId} FOR UPDATE
      `;

      await tx`
        UPDATE kingpay_wallets
        SET balance_paise = balance_paise + ${amountPaise},
            updated_at = NOW()
        WHERE user_id = ${customerId}
      `;

      await tx`
        INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
        VALUES (${txId}, ${customerId}, ${amountPaise}, 'CREDIT', ${"Wallet credit " + idempotencyKey})
      `;

      return { status: "success", transactionId: txId };
    });
  },

  async deductWallet(customerId: string, amountPaise: number, idempotencyKey: string) {
    if (!customerId || !Number.isInteger(amountPaise) || amountPaise <= 0 || !idempotencyKey) {
      throw new Error("Invalid wallet debit request");
    }

    const sql = await getSql();
    const txId = transactionId(idempotencyKey);

    return await sql.transaction(async (tx) => {
      const existing = await tx<{ id: string }>`
        SELECT id FROM kingpay_transactions WHERE id = ${txId}
      `;
      if (existing.length > 0) return { status: "already_processed", transactionId: txId };

      const wallets = await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_wallets
        WHERE user_id = ${customerId} FOR UPDATE
      `;

      if (wallets.length === 0 || Number(wallets[0].balance_paise) < amountPaise) {
        throw new Error("Insufficient wallet balance");
      }

      await tx`
        UPDATE kingpay_wallets
        SET balance_paise = balance_paise - ${amountPaise},
            updated_at = NOW()
        WHERE user_id = ${customerId}
      `;

      await tx`
        INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
        VALUES (${txId}, ${customerId}, ${amountPaise}, 'DEBIT', ${"Wallet debit " + idempotencyKey})
      `;

      return { status: "success", transactionId: txId };
    });
  },
};
