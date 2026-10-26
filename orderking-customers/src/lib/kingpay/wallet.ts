import { getSql } from "../db.ts";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export const TopUpSchema = z.object({
  customerId: z.string(),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string(),
});

export const walletEngine = {
  async getBalance(customerId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ balance_paise: number }>`
      SELECT balance_paise 
      FROM kingpay_wallets 
      WHERE user_id = ${customerId}
    `;
    return Number(result[0]?.balance_paise || 0);
  },

  async createTopUpOrder(input: z.infer<typeof TopUpSchema>) {
    const data = TopUpSchema.parse(input);
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) throw new Error('Razorpay credentials missing.');
    const token = btoa(keyId + ':' + keySecret);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: data.amountPaise,
        currency: 'INR',
        receipt: 'topup_' + data.customerId.substring(0,8),
        notes: {
          customerId: data.customerId,
          idempotencyKey: data.idempotencyKey,
        }
      })
    });
    if (!res.ok) throw new Error('Razorpay api failed');
    return await res.json() as any;
  },

  async creditWallet(customerId: string, amountPaise: number, idempotencyKey: string) {
    const sql = await getSql();
    return await sql.transaction(async (tx) => {
      // Idempotency check via transaction table
      const existing = await tx`
        SELECT 1 FROM kingpay_transactions 
        WHERE id = ${idempotencyKey} OR description LIKE ${'%' + idempotencyKey + '%'}
        LIMIT 1
      `;
      if (existing.length > 0) return { status: "already_processed" };

      // Row-level lock on the wallet
      const wallets = await tx<{ user_id: string }>`
        SELECT user_id FROM kingpay_wallets 
        WHERE user_id = ${customerId} FOR UPDATE
      `;

      if (wallets.length === 0) {
        await tx`
          INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
          VALUES (${customerId}, 0, 0)
          ON CONFLICT (user_id) DO NOTHING
        `;
      }

      await tx`
        UPDATE kingpay_wallets 
        SET balance_paise = balance_paise + ${amountPaise}, 
            updated_at = NOW()
        WHERE user_id = ${customerId}
      `;

      await tx`
        INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
        VALUES (${idempotencyKey || randomUUID()}, ${customerId}, ${amountPaise}, 'CREDIT', ${'Top-Up: ' + idempotencyKey})
      `;

      return { status: "success" };
    });
  },
  
  async deductWallet(customerId: string, amountPaise: number, idempotencyKey: string) {
    const sql = await getSql();
    return await sql.transaction(async (tx) => {
      const existing = await tx`
        SELECT 1 FROM kingpay_transactions 
        WHERE id = ${idempotencyKey} OR description LIKE ${'%' + idempotencyKey + '%'}
        LIMIT 1
      `;
      if (existing.length > 0) return { status: "already_processed" };

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
        VALUES (${idempotencyKey || randomUUID()}, ${customerId}, ${amountPaise}, 'DEBIT', ${'Payment: ' + idempotencyKey})
      `;

      return { status: "success" };
    });
  }
};
