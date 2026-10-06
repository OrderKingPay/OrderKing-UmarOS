import { getSql } from "../db.ts";
import Razorpay from "razorpay";
import { z } from "zod";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret",
});

export const SettlementSchema = z.object({
  restaurantId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string(),
});

export const settlementEngine = {
  async getPendingBalance(restaurantId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ balance_paise: number }>`
      SELECT balance_paise 
      FROM partner_ledgers 
      WHERE restaurant_id = ${restaurantId}
    `;
    return result[0]?.balance_paise || 0;
  },

  async triggerSettlement(input: z.infer<typeof SettlementSchema>) {
    const data = SettlementSchema.parse(input);
    const sql = await getSql();
    
    return await sql.transaction(async (tx) => {
      const existing = await tx`
        SELECT 1 FROM settlement_history 
        WHERE idempotency_key = ${data.idempotencyKey}
      `;
      if (existing.length > 0) return { status: "already_processed" };

      const ledgers = await tx<{ balance_paise: number, fund_account_id: string }>`
        SELECT balance_paise, fund_account_id 
        FROM partner_ledgers 
        WHERE restaurant_id = ${data.restaurantId} FOR UPDATE
      `;

      if (ledgers.length === 0) {
        throw new Error("Ledger not found for restaurant");
      }
      
      const ledger = ledgers[0];
      if (ledger.balance_paise < data.amountPaise) {
        throw new Error("Insufficient balance for settlement");
      }

      await tx`
        UPDATE partner_ledgers 
        SET balance_paise = balance_paise - ${data.amountPaise}, 
            updated_at = NOW()
        WHERE restaurant_id = ${data.restaurantId}
      `;

      await tx`
        INSERT INTO settlement_history (restaurant_id, amount_paise, idempotency_key, status)
        VALUES (${data.restaurantId}, ${data.amountPaise}, ${data.idempotencyKey}, 'PROCESSING')
      `;

      const transfer = await razorpay.transfers.create({
        account: ledger.fund_account_id,
        amount: data.amountPaise,
        currency: "INR",
        notes: {
          restaurantId: data.restaurantId,
          idempotencyKey: data.idempotencyKey,
        }
      });

      return { status: "processing", transferId: transfer.id };
    });
  }
};
