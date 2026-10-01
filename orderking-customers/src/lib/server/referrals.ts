import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { createHash } from "node:crypto";
export type ReferralStats = { status: "ACTIVE" | "PROVIDER_REQUIRED"; referralCode: string; shareUrl: string; totalInvited: number; totalEarnedPaise: number; rewardPerFriendPaise: number; friendDiscountPaise: number; minOrderPaise: number; };
function referralCode(userId: string, secret: string) { return "OK-" + createHash("sha256").update(userId + ":" + secret).digest("hex").slice(0, 10).toUpperCase(); }
export const getReferralStatsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<ReferralStats> => {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new Error("REFERRAL_CONFIGURATION_REQUIRED");
  const sql = await getSql();
  const code = referralCode(context.userId, secret);
  await sql`INSERT INTO referral_codes (user_id, referral_code) VALUES (${context.userId}, ${code}) ON CONFLICT (user_id) DO NOTHING`;
  const campaigns = await sql<{ id: string; reward_per_qualification_paise: number; min_order_paise: number; active: boolean }>`
    SELECT id, reward_per_qualification_paise, min_order_paise, active FROM growth_campaigns WHERE active = true ORDER BY starts_at DESC LIMIT 1
  `;
  const campaign = campaigns[0];
  const invited = await sql<{ count: number }>`SELECT count(*)::int AS count FROM growth_event_ledger WHERE actor_id = ${context.userId} AND metric = 'QUALIFIED_REFERRAL' AND fraud_state = 'VERIFIED'`;
  const earned = await sql<{ total: number }>`SELECT COALESCE(sum(reward_paise), 0)::bigint AS total FROM growth_reward_ledger_v2 WHERE user_id::text = ${context.userId} AND status = 'PAID'`;
  return { status: campaign?.active ? "ACTIVE" : "PROVIDER_REQUIRED", referralCode: code, shareUrl: `${process.env.CUSTOMER_APP_URL || "https://orderking.in"}/account/?ref=${encodeURIComponent(code)}`, totalInvited: Number(invited[0]?.count ?? 0), totalEarnedPaise: Number(earned[0]?.total ?? 0), rewardPerFriendPaise: Number(campaign?.reward_per_qualification_paise ?? 0), friendDiscountPaise: 0, minOrderPaise: Number(campaign?.min_order_paise ?? 0) };
});
export const recordQualifiedReferralFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).inputValidator((input: { referralCode: string; orderId: string }) => input).handler(async ({ context, data }) => {
  const sql = await getSql();
  const referrer = await sql<{ user_id: string }>`SELECT user_id FROM referral_codes WHERE referral_code = ${data.referralCode} LIMIT 1`;
  if (!referrer[0]) throw new Error("REFERRAL_NOT_FOUND");
  if (referrer[0].user_id === context.userId) throw new Error("SELF_REFERRAL_NOT_ALLOWED");
  const campaign = await sql<{ id: string; reward_per_qualification_paise: number; min_order_paise: number; max_budget_paise: number }>`SELECT id, reward_per_qualification_paise, min_order_paise, max_budget_paise FROM growth_campaigns WHERE active = true ORDER BY starts_at DESC LIMIT 1`;
  if (!campaign[0]) throw new Error("REFERRAL_CAMPAIGN_UNAVAILABLE");
  const spendRows = await sql<{ total: number }>`SELECT COALESCE(sum(reward_paise),0)::bigint AS total FROM growth_reward_ledger_v2 WHERE campaign_id = ${campaign[0].id} AND status <> 'REJECTED'`;
  if (Number(spendRows[0]?.total ?? 0) + Number(campaign[0].reward_per_qualification_paise) > Number(campaign[0].max_budget_paise)) throw new Error("REFERRAL_CAMPAIGN_BUDGET_EXHAUSTED");
  const order = await sql<{ id: string; customer_id: string; total_paise: number; status: string; payment_status: string }>`SELECT id, customer_id, total_paise, status, payment_status FROM orders WHERE id = ${data.orderId} AND customer_id = ${context.userId} LIMIT 1`;
  const row = order[0];
  if (!row || row.status !== "DELIVERED" || row.payment_status === "REFUNDED" || row.payment_status === "CANCELLED" || Number(row.total_paise) < Number(campaign[0].min_order_paise)) throw new Error("REFERRAL_ORDER_NOT_QUALIFIED");
  const dedupeKey = `${campaign[0].id}:${referrer[0].user_id}:${context.userId}:${data.orderId}`;
  const event = await sql<{ growth_event_id: string }>`INSERT INTO growth_event_ledger (campaign_id,user_id,actor_type,actor_id,metric,value,dedupe_key,fraud_state,metadata) VALUES (${campaign[0].id},NULL,'REFERRER',${referrer[0].user_id},'QUALIFIED_REFERRAL',1,${dedupeKey},'VERIFIED',${JSON.stringify({ referredUserId: context.userId, orderId: data.orderId })}) ON CONFLICT (dedupe_key) DO NOTHING RETURNING growth_event_id`;
  if (event[0]) await sql`INSERT INTO growth_reward_ledger_v2 (campaign_id,user_id,source_growth_event_id,reward_paise,reward_coins,status,reason) VALUES (${campaign[0].id},${referrer[0].user_id},${event[0].growth_event_id},${campaign[0].reward_per_qualification_paise},0,'PENDING','Qualified referral after completed eligible order') ON CONFLICT (source_growth_event_id) DO NOTHING`;
  return { accepted: true, status: "PENDING_REWARD_VERIFICATION" as const };
});