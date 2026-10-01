// @ts-nocheck
import { getSql } from "@/lib/db";

export async function listActiveAffiliateOffers(category?: string) {
  const sql = await getSql();
  return await sql\`
    SELECT id, provider_name, category, payout_bps, fixed_payout_paise, click_url, disclosure_label
    FROM affiliate_partner_offers
    WHERE status='ACTIVE'
      AND (\${category ?? null} IS NULL OR category=\${category ?? null})
    ORDER BY payout_bps DESC, fixed_payout_paise DESC
  \`;
}

export async function recordAffiliateClick(input: {
  offerId:string;
  userId?:string;
  clickId:string;
  dedupeKey:string;
}) {
  const sql = await getSql();
  const rows = await sql\`
    INSERT INTO affiliate_click_ledger (offer_id,user_id,click_id,dedupe_key,status)
    SELECT id,\${input.userId ?? null},\${input.clickId},\${input.dedupeKey},'CLICKED'
    FROM affiliate_partner_offers
    WHERE id=\${input.offerId} AND status='ACTIVE'
    ON CONFLICT (offer_id,dedupe_key) DO NOTHING
    RETURNING id,click_id
  \`;
  if (!rows[0]) return { accepted:false, reason:"DUPLICATE_OR_INACTIVE_OFFER" };
  return { accepted:true, clickId:rows[0].click_id };
}

export async function recordAffiliateConversion(input:{
  clickId:string;
  providerReference:string;
  commissionPaise:number;
}) {
  const sql = await getSql();
  const rows = await sql\`
    UPDATE affiliate_click_ledger
    SET converted_at=NOW(),
        provider_reference=\${input.providerReference},
        commission_paise=\${Math.max(0,Math.trunc(input.commissionPaise))},
        status='CONVERTED'
    WHERE click_id=\${input.clickId}
      AND status='CLICKED'
    RETURNING id
  \`;
  return { converted:Boolean(rows[0]) };
}
