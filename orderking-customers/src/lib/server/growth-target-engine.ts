import { createHash, createHmac, randomUUID } from "node:crypto";
import { getSql, type Sql } from "@/lib/db";

type GrowthCampaign = {
  id: string;
  name: string;
  target_qualifications: number;
  reward_per_qualification_paise: number;
  max_budget_paise: number;
  min_order_paise: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

function requireReferralSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new Error("REFERRAL_CONFIGURATION_REQUIRED");
  return secret;
}

function hashRequestSignal(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHash("sha256").update(requireReferralSecret()).update(value).digest("hex");
}

export function buildReferralCode(userId: string): string {
  const secret = requireReferralSecret();
  const digest = createHmac("sha256", secret).update(userId).digest("hex").slice(0, 10).toUpperCase();
  return `OK-${digest}`;
}

export async function ensureReferralCode(userId: string): Promise<string> {
  const sql = await getSql();
  const existing = await sql<{ referral_code: string }>`
    SELECT referral_code FROM growth_referral_codes
    WHERE user_id = ${userId} AND active = true
    LIMIT 1
  `;
  if (existing[0]?.referral_code) return existing[0].referral_code;

  const referralCode = buildReferralCode(userId);
  await sql`
    INSERT INTO growth_referral_codes (user_id, referral_code, active)
    VALUES (${userId}, ${referralCode}, true)
    ON CONFLICT (user_id)
    DO UPDATE SET referral_code = EXCLUDED.referral_code, active = true
  `;
  return referralCode;
}

async function activeCampaign(tx: Sql): Promise<GrowthCampaign | null> {
  const rows = await tx<GrowthCampaign>`
    SELECT id, name, target_qualifications, reward_per_qualification_paise,
           max_budget_paise, min_order_paise, starts_at::text, ends_at::text, active
    FROM growth_campaigns
    WHERE active = true
      AND starts_at <= now()
      AND ends_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getGrowthStats(userId: string) {
  const sql = await getSql();
  const referralCode = await ensureReferralCode(userId);
  const [campaigns, earned, qualified, invited] = await Promise.all([
    sql<GrowthCampaign>`
      SELECT id, name, target_qualifications, reward_per_qualification_paise,
             max_budget_paise, min_order_paise, starts_at::text, ends_at::text, active
      FROM growth_campaigns
      WHERE active = true AND starts_at <= now() AND ends_at > now()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    sql<{ total: number }>`
      SELECT COALESCE(SUM(amount_paise),0)::bigint AS total
      FROM growth_bonus_ledger
      WHERE user_id = ${userId} AND status = 'POSTED'
    `,
    sql<{ total: number }>`
      SELECT COUNT(*)::int AS total
      FROM growth_referral_events
      WHERE referrer_user_id = ${userId} AND event_type = 'QUALIFIED_ORDER'
    `,
    sql<{ total: number }>`
      SELECT COUNT(DISTINCT invitee_user_id)::int AS total
      FROM growth_referral_events
      WHERE referrer_user_id = ${userId} AND event_type IN ('SIGNUP','QUALIFIED_ORDER')
    `,
  ]);

  const campaign = campaigns[0] || null;
  return {
    status: campaign ? "ACTIVE" : "NO_ACTIVE_CAMPAIGN",
    referralCode,
    shareUrl: `${process.env.CUSTOMER_APP_URL || "https://orderking.in"}/?ref=${encodeURIComponent(referralCode)}`,
    campaign: campaign
      ? {
          id: campaign.id,
          name: campaign.name,
          target: Number(campaign.target_qualifications),
          rewardPerQualifiedOrderPaise: Number(campaign.reward_per_qualification_paise),
          minOrderPaise: Number(campaign.min_order_paise),
          endsAt: campaign.ends_at,
        }
      : null,
    progress: {
      invited: Number(invited[0]?.total || 0),
      qualified: Number(qualified[0]?.total || 0),
      earnedPaise: Number(earned[0]?.total || 0),
      target: campaign ? Number(campaign.target_qualifications) : 0,
    },
  };
}

export async function recordReferralVisit(
  referralCode: string,
  request: Request,
  source = "share",
): Promise<void> {
  const sql = await getSql();
  const campaign = await sql<GrowthCampaign>`
    SELECT id, name, target_qualifications, reward_per_qualification_paise,
           max_budget_paise, min_order_paise, starts_at::text, ends_at::text, active
    FROM growth_campaigns
    WHERE active = true AND starts_at <= now() AND ends_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!campaign[0]) return;

  const referrer = await sql<{ user_id: string }>`
    SELECT user_id FROM growth_referral_codes
    WHERE referral_code = ${referralCode} AND active = true
    LIMIT 1
  `;
  if (!referrer[0]) return;

  await sql`
    INSERT INTO growth_referral_events (
      id, campaign_id, referral_code, referrer_user_id, event_type,
      source, ip_hash, user_agent_hash, metadata
    )
    VALUES (
      ${randomUUID()}, ${campaign[0].id}, ${referralCode}, ${referrer[0].user_id}, 'VISIT',
      ${source}, ${hashRequestSignal(request.headers.get("x-forwarded-for"))},
      ${hashRequestSignal(request.headers.get("user-agent"))}, '{}'::jsonb
    )
  `;
}

export async function attachReferralSignup(
  referralCode: string,
  inviteeUserId: string,
  request: Request,
  source = "signup",
): Promise<void> {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`
    SELECT user_id FROM growth_referral_codes
    WHERE referral_code = ${referralCode} AND active = true
    LIMIT 1
  `;
  const referrerId = rows[0]?.user_id;
  if (!referrerId || referrerId === inviteeUserId) return;

  const existing = await sql`
    SELECT id FROM growth_referral_events
    WHERE invitee_user_id = ${inviteeUserId}
      AND event_type = 'SIGNUP'
    LIMIT 1
  `;
  if (existing.length) return;

  const campaign = await sql<{ id: string }>`
    SELECT id FROM growth_campaigns
    WHERE active = true AND starts_at <= now() AND ends_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!campaign[0]) return;

  await sql`
    INSERT INTO growth_referral_events (
      id, campaign_id, referral_code, referrer_user_id, invitee_user_id,
      event_type, source, ip_hash, user_agent_hash
    )
    VALUES (
      ${randomUUID()}, ${campaign[0].id}, ${referralCode}, ${referrerId}, ${inviteeUserId},
      'SIGNUP', ${source}, ${hashRequestSignal(request.headers.get("x-forwarded-for"))},
      ${hashRequestSignal(request.headers.get("user-agent"))}
    )
  `;
}

export async function qualifyReferralOrder(
  inviteeUserId: string,
  orderId: string,
): Promise<{ qualified: boolean; rewardPaise: number }> {
  const sql = await getSql();
  return sql.transaction(async (tx: Sql) => {
    const orderRows = await tx<{ total_paise: number; status: string; payment_status: string; customer_id: string }>`
      SELECT total_paise, status, payment_status, customer_id
      FROM orders
      WHERE id = ${orderId}
      FOR UPDATE
    `;
    const order = orderRows[0];
    if (!order || order.customer_id !== inviteeUserId) return { qualified: false, rewardPaise: 0 };
    if (order.status !== "DELIVERED") return { qualified: false, rewardPaise: 0 };
    if (["CANCELLED","REFUNDED","PAYMENT_FAILED"].includes(order.payment_status)) return { qualified: false, rewardPaise: 0 };

    const signup = await tx<{ campaign_id: string; referrer_user_id: string }>`
      SELECT campaign_id, referrer_user_id
      FROM growth_referral_events
      WHERE invitee_user_id = ${inviteeUserId}
        AND event_type = 'SIGNUP'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    if (!signup[0]?.campaign_id || !signup[0]?.referrer_user_id) return { qualified: false, rewardPaise: 0 };

    const campaignRows = await tx<GrowthCampaign>`
      SELECT id, name, target_qualifications, reward_per_qualification_paise,
             max_budget_paise, min_order_paise, starts_at::text, ends_at::text, active
      FROM growth_campaigns
      WHERE id = ${signup[0].campaign_id}
        AND active = true
        AND starts_at <= now()
        AND ends_at > now()
      FOR UPDATE
    `;
    const campaign = campaignRows[0];
    if (!campaign || Number(order.total_paise) < Number(campaign.min_order_paise)) {
      return { qualified: false, rewardPaise: 0 };
    }

    const already = await tx`
      SELECT id FROM growth_referral_events
      WHERE campaign_id = ${campaign.id}
        AND invitee_user_id = ${inviteeUserId}
        AND event_type = 'QUALIFIED_ORDER'
      LIMIT 1
    `;
    if (already.length) return { qualified: false, rewardPaise: 0 };

    const used = await tx<{ total: number; count: number }>`
      SELECT
        COALESCE(SUM(amount_paise),0)::bigint AS total,
        COUNT(*)::int AS count
      FROM growth_bonus_ledger
      WHERE campaign_id = ${campaign.id} AND status = 'POSTED'
    `;
    const totalUsed = Number(used[0]?.total || 0);
    const countUsed = Number(used[0]?.count || 0);
    const reward = Math.min(
      Number(campaign.reward_per_qualification_paise),
      Math.max(0, Number(campaign.max_budget_paise) - totalUsed),
    );
    if (reward <= 0 || countUsed >= Number(campaign.target_qualifications)) {
      return { qualified: false, rewardPaise: 0 };
    }

    const eventId = randomUUID();
    await tx`
      INSERT INTO growth_referral_events (
        id, campaign_id, referral_code, referrer_user_id, invitee_user_id,
        event_type, order_id, amount_paise, qualified_at, metadata
      )
      SELECT
        ${eventId}, ${campaign.id}, c.referral_code, ${signup[0].referrer_user_id}, ${inviteeUserId},
        'QUALIFIED_ORDER', ${orderId}, ${order.total_paise}, now(), '{}'::jsonb
      FROM growth_referral_codes c
      WHERE c.user_id = ${signup[0].referrer_user_id}
      LIMIT 1
    `;

    await tx`
      INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
      VALUES (${signup[0].referrer_user_id}, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `;
    await tx`
      SELECT balance_paise FROM kingpay_wallets
      WHERE user_id = ${signup[0].referrer_user_id}
      FOR UPDATE
    `;
    await tx`
      UPDATE kingpay_wallets
      SET balance_paise = balance_paise + ${reward},
          updated_at = now()
      WHERE user_id = ${signup[0].referrer_user_id}
    `;
    await tx`
      INSERT INTO kingpay_transactions (
        id, user_id, amount_paise, type, description
      )
      VALUES (
        ${"ref_" + eventId}, ${signup[0].referrer_user_id}, ${reward}, 'CREDIT',
        ${"Verified referral reward for qualified order " + orderId}
      )
    `;
    await tx`
      INSERT INTO growth_bonus_ledger (
        id, campaign_id, event_id, user_id, amount_paise, status, reason
      )
      VALUES (
        ${"bonus_" + eventId}, ${campaign.id}, ${eventId}, ${signup[0].referrer_user_id},
        ${reward}, 'POSTED', ${"Qualified delivered order " + orderId}
      )
    `;

    return { qualified: true, rewardPaise: reward };
  });
}
