import { createHash, createHmac } from "node:crypto";
import { getSql } from "./db";

function trackingSecret(): string {
  return process.env.AFFILIATE_TRACKING_SECRET?.trim()
    || process.env.BETTER_AUTH_SECRET?.trim()
    || "";
}

export function hashTrackingSignal(value: string | null | undefined): string | null {
  const secret = trackingSecret();
  if (!secret || !value) return null;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function trackAffiliateClick(params: {
  partnerId: string;
  userId?: string | null;
  campaignId?: string | null;
  source?: string | null;
  request: Request;
}): Promise<string> {
  const sql = await getSql();
  const rows = await sql<{ id: string; tracking_base_url: string | null; active: boolean }>`
    SELECT id, tracking_base_url, active
    FROM affiliate_partners
    WHERE id = ${params.partnerId} AND active = true
    LIMIT 1
  `;
  const partner = rows[0];
  if (!partner?.tracking_base_url) throw new Error("AFFILIATE_PARTNER_NOT_CONFIGURED");

  const destination = new URL(partner.tracking_base_url);
  destination.searchParams.set("ok_source", params.source || "orderking");
  destination.searchParams.set("ok_click_id", crypto.randomUUID());

  await sql`
    INSERT INTO affiliate_clicks (
      id, partner_id, user_id, campaign_id, source,
      destination_url, ip_hash, user_agent_hash
    )
    VALUES (
      ${crypto.randomUUID()},
      ${partner.id},
      ${params.userId || null},
      ${params.campaignId || null},
      ${params.source || null},
      ${destination.toString()},
      ${hashTrackingSignal(params.request.headers.get("x-forwarded-for"))},
      ${hashTrackingSignal(params.request.headers.get("user-agent"))}
    )
  `;

  return destination.toString();
}
