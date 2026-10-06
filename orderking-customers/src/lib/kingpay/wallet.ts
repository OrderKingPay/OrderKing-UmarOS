
import { getSql } from "../db.ts";
import { z } from "zod";



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



