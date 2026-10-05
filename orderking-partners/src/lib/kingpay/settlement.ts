import { getSql } from "../db.ts";
import Razorpay from "razorpay";
import { z } from "zod";

function getRazorpayClient(): Razorpay {
  const mode = (process.env.RAZORPAY_MODE ?? "live").trim().toLowerCase();
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) throw new Error("Razorpay is not configured.");
  if (keyId === "test_key" || keySecret === "test_secret") {
    throw new Error("Placeholder Razorpay credentials are forbidden.");
  }

  const isTestKey = keyId.startsWith("rzp_test_");
  if (mode === "live" && isTestKey) throw new Error("Live Razorpay mode refuses test credentials.");
  if (mode === "sandbox" && !isTestKey) throw new Error("Sandbox Razorpay mode requires an rzp_test_ key.");

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export const SettlementSchema = z.object({
  restaurantId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string().min(1),
});

export const settlementEngine = {
  async getPendingBalance(restaurantId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ pending_paise: number }>`
      SELECT coalesce(sum(net_paise), 0)::int AS pending_paise
      FROM settlement_batches
      WHERE party_id = ${restaurantId}
        AND party_type = 'RESTAURANT'
        AND status IN ('READY', 'APPROVED')
    `;
    return Number(result[0]?.pending_paise ?? 0);
  },

  async triggerSettlement(input: z.infer<typeof SettlementSchema>) {
    const data = SettlementSchema.parse(input);
    const sql = await getSql();

    // The authoritative ledger has no verified payout-account/Route-account mapping
    // yet. Never invent one or transfer money to an unverified account.
    const batches = await sql<{ id: string; net_paise: number; external_reference: string | null; status: string }>`
      SELECT id, net_paise, external_reference, status
      FROM settlement_batches
      WHERE party_id = ${data.restaurantId}
        AND party_type = 'RESTAURANT'
        AND status IN ('READY', 'APPROVED')
        AND net_paise >= ${data.amountPaise}
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE
    `;

    if (batches.length === 0) {
      throw new Error("No eligible settlement batch exists for this restaurant.");
    }

    const batch = batches[0];
    if (!batch.external_reference) {
      return {
        status: "NOT_ENABLED" as const,
        reason: "A verified payout-provider account/reference is required before any restaurant transfer can be initiated.",
        settlementBatchId: batch.id,
      };
    }

    const configuredProvider = process.env.KINGPAY_PAYOUT_PROVIDER?.trim().toLowerCase();
    if (configuredProvider !== "razorpay_route") {
      return {
        status: "NOT_ENABLED" as const,
        reason: "KINGPAY_PAYOUT_PROVIDER must be explicitly configured as an approved payout rail before transfer execution.",
        settlementBatchId: batch.id,
      };
    }

    const razorpay = getRazorpayClient();
    // external_reference must be a provider-verified recipient identifier. The
    // mapping is intentionally not inferred from restaurant IDs.
    const transfer = await razorpay.transfers.create({
      account: batch.external_reference,
      amount: data.amountPaise,
      currency: "INR",
      notes: {
        restaurantId: data.restaurantId,
        settlementBatchId: batch.id,
        idempotencyKey: data.idempotencyKey,
      },
    });

    await sql`
      UPDATE settlement_batches
      SET status = 'PAID',
          external_reference = ${transfer.id},
          paid_at = NOW()
      WHERE id = ${batch.id}
    `;

    return { status: "processing" as const, settlementBatchId: batch.id, transferId: transfer.id };
  },
};
