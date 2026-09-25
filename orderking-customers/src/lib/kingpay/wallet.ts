import { getSql } from "../db.ts";
import Razorpay from "razorpay";
import { z } from "zod";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret",
});

export const TopUpSchema = z.object({
  customerId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string(),
});

export const walletEngine = {
  async getBalance(customerId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ balance_paise: number }>`
      SELECT balance_paise 
      FROM customer_wallets 
      WHERE customer_id = ${customerId}
    `;
    return result[0]?.balance_paise || 0;
  },

  async createTopUpOrder(input: z.infer<typeof TopUpSchema>) {
    const data = TopUpSchema.parse(input);
    const order = await razorpay.orders.create({
      amount: data.amountPaise,
      currency: "INR",
      receipt: `topup_${data.customerId}_${Date.now()}`,
      notes: {
        customerId: data.customerId,
        idempotencyKey: data.idempotencyKey,
      }
    });
    return order;
  },

  async creditWallet(customerId: string, amountPaise: number, idempotencyKey: string) {
    const sql = await getSql();
    return await sql.transaction(async (tx) => {
      // Idempotency check
      const existing = await tx`
        SELECT 1 FROM wallet_transactions 
        WHERE idempotency_key = ${idempotencyKey}
      `;
      if (existing.length > 0) return { status: "already_processed" };

      // Row-level lock on the wallet
      const wallets = await tx<{ customer_id: string }>`
        SELECT customer_id FROM customer_wallets 
        WHERE customer_id = ${customerId} FOR UPDATE
      `;

      if (wallets.length === 0) {
        // Create wallet if it doesn't exist
        await tx`
          INSERT INTO customer_wallets (customer_id, balance_paise)
          VALUES (${customerId}, 0)
        `;
      }

      await tx`
        UPDATE customer_wallets 
        SET balance_paise = balance_paise + ${amountPaise}, 
            updated_at = NOW()
        WHERE customer_id = ${customerId}
      `;

      await tx`
        INSERT INTO wallet_transactions (customer_id, type, amount_paise, idempotency_key)
        VALUES (${customerId}, 'CREDIT', ${amountPaise}, ${idempotencyKey})
      `;

      return { status: "success" };
    });
  },
  
  async deductWallet(customerId: string, amountPaise: number, idempotencyKey: string) {
    const sql = await getSql();
    return await sql.transaction(async (tx) => {
      const existing = await tx`
        SELECT 1 FROM wallet_transactions 
        WHERE idempotency_key = ${idempotencyKey}
      `;
      if (existing.length > 0) return { status: "already_processed" };

      const wallets = await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM customer_wallets 
        WHERE customer_id = ${customerId} FOR UPDATE
      `;

      if (wallets.length === 0 || wallets[0].balance_paise < amountPaise) {
        throw new Error("Insufficient wallet balance");
      }

      await tx`
        UPDATE customer_wallets 
        SET balance_paise = balance_paise - ${amountPaise}, 
            updated_at = NOW()
        WHERE customer_id = ${customerId}
      `;

      await tx`
        INSERT INTO wallet_transactions (customer_id, type, amount_paise, idempotency_key)
        VALUES (${customerId}, 'DEBIT', ${amountPaise}, ${idempotencyKey})
      `;

      return { status: "success" };
    });
  }
};
