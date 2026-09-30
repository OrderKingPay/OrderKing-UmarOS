import { getSql } from "../db.ts";
import { z } from "zod";

export const SettlementSchema = z.object({
  restaurantId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  idempotencyKey: z.string().min(8),
});

export const settlementEngine = {
  async getPendingBalance(restaurantId: string): Promise<number> {
    const sql = await getSql();
    const result = await sql<{ payable_paise: number }>`
      SELECT
        GREATEST(
          0,
          COALESCE((
            SELECT SUM(amount_paise)
            FROM ledger_entries
            WHERE party = 'RESTAURANT'
              AND restaurant_id = ${restaurantId}
              AND kind = 'restaurant_settlement'
          ), 0)
          -
          COALESCE((
            SELECT SUM(payable_paise)
            FROM settlement_batches
            WHERE party_type = 'RESTAURANT'
              AND party_id = ${restaurantId}
              AND status IN ('PENDING_PROVIDER', 'PROCESSING', 'PAID')
          ), 0)
        ) AS payable_paise
    `;
    return Number(result[0]?.payable_paise ?? 0);
  },

  async triggerSettlement(input: z.infer<typeof SettlementSchema>) {
    const data = SettlementSchema.parse(input);
    const sql = await getSql();

    return await sql.transaction(async (tx) => {
      const existing = await tx`
        SELECT id, status, payable_paise, external_reference
        FROM settlement_batches
        WHERE reason LIKE ${`%idempotency:${data.idempotencyKey}%`}
        LIMIT 1
      `;
      if (existing.length > 0) return { status: existing[0].status, batchId: existing[0].id, externalReference: existing[0].external_reference };

      const restaurant = await tx<{ id: string; name: string; active: boolean; org_id: string }>`
        SELECT r.id, r.name, r.active, o.org_id
        FROM restaurants r
        LEFT JOIN LATERAL (
          SELECT org_id FROM orders WHERE restaurant_id = r.id ORDER BY placed_at DESC LIMIT 1
        ) o ON true
        WHERE r.id = ${data.restaurantId}
        LIMIT 1
      `;
      if (restaurant.length === 0) throw new Error("RESTAURANT_NOT_FOUND");
      if (!restaurant[0].active) throw new Error("RESTAURANT_INACTIVE");
      if (!restaurant[0].org_id) throw new Error("ORG_MAPPING_REQUIRED");

      const pending = await tx<{ payable_paise: number }>`
        SELECT GREATEST(
          0,
          COALESCE((
            SELECT SUM(amount_paise)
            FROM ledger_entries
            WHERE party='RESTAURANT' AND restaurant_id=${data.restaurantId}
              AND kind='restaurant_settlement'
          ),0)
          -
          COALESCE((
            SELECT SUM(payable_paise)
            FROM settlement_batches
            WHERE party_type='RESTAURANT' AND party_id=${data.restaurantId}
              AND status IN ('PENDING_PROVIDER','PROCESSING','PAID')
          ),0)
        ) AS payable_paise
      `;
      const pendingPaise = Number(pending[0]?.payable_paise ?? 0);
      if (data.amountPaise > pendingPaise) throw new Error("SETTLEMENT_EXCEEDS_VERIFIED_PENDING_BALANCE");

      const batchId = `stl_${data.restaurantId}_${data.idempotencyKey.slice(0, 24)}`;
      const inserted = await tx`
        INSERT INTO settlement_batches (
          id, org_id, party_type, party_id, party_name, payable_paise, status,
          reason, created_at, gross_paise, fee_paise, net_paise
        )
        VALUES (
          ${batchId}, ${restaurant[0].org_id}, 'RESTAURANT', ${restaurant[0].id},
          ${restaurant[0].name}, ${data.amountPaise}, 'PENDING_PROVIDER',
          ${`PROVIDER_REQUIRED; idempotency:${data.idempotencyKey}`},
          NOW(), ${data.amountPaise}, 0, ${data.amountPaise}
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id, status, payable_paise, external_reference
      `;

      if (!inserted.length) {
        return { status: "ALREADY_EXISTS", batchId, providerRequired: true };
      }

      return {
        status: "PENDING_PROVIDER",
        batchId: inserted[0].id,
        payablePaise: Number(inserted[0].payable_paise),
        providerRequired: true,
        message: "Settlement batch created from the verified ledger. No external transfer was attempted because the live restaurant payout destination/provider is not configured in the production schema.",
      };
    });
  },
};
