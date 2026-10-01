import { getSql } from "@/lib/db";
import { randomUUID } from "node:crypto";
export type GrowthParticipant = "CUSTOMER" | "PARTNER" | "RIDER";
type QualificationRequest = { campaignId: string; participantType: GrowthParticipant; participantId: string; periodStart?: string; periodEnd?: string };
export async function recordTargetQualification(input: QualificationRequest) {
  const sql = await getSql();
  return await sql.transaction(async (tx) => {
    const campaigns = await tx<{
      id:string; target_qualifications:number; reward_per_qualification_paise:number; reward_coins:number;
      max_budget_paise:number; min_order_paise:number; starts_at:string; ends_at:string; active:boolean;
      participant_type:GrowthParticipant; target_metric:string;
    }>`SELECT id,target_qualifications,reward_per_qualification_paise,reward_coins,max_budget_paise,min_order_paise,starts_at,ends_at,active,participant_type,target_metric FROM growth_campaigns WHERE id=${input.campaignId} FOR UPDATE`;
    const campaign = campaigns[0];
    if (!campaign || !campaign.active) throw new Error("GROWTH_CAMPAIGN_INACTIVE");
    if (campaign.participant_type !== input.participantType) throw new Error("GROWTH_PARTICIPANT_MISMATCH");
    const start = input.periodStart ? new Date(input.periodStart) : new Date(campaign.starts_at);
    const end = input.periodEnd ? new Date(input.periodEnd) : new Date(campaign.ends_at);
    const metric = campaign.target_metric;
    const existing = await tx<{count:number}>`SELECT COUNT(*)::int AS count FROM growth_event_ledger WHERE campaign_id=${campaign.id} AND actor_id=${input.participantId} AND metric=${metric} AND fraud_state='VERIFIED' AND occurred_at>=${start} AND occurred_at<${end}`;
    const verifiedAlready = Number(existing[0]?.count ?? 0);
    let proofCount = 0;
    if (input.participantType === "PARTNER" && metric === "DELIVERED_ORDER") {
      const rows = await tx<{count:number}[]>`SELECT COUNT(*)::int AS count FROM orders WHERE restaurant_id=${input.participantId} AND status='DELIVERED' AND payment_status NOT IN ('REFUNDED','CANCELLED') AND total_paise>=${campaign.min_order_paise} AND placed_at>=${start} AND placed_at<${end}`;
      proofCount = Number(rows[0]?.count ?? 0);
    } else if (input.participantType === "RIDER" && metric === "DELIVERED_ORDER") {
      const rows = await tx<{count:number}[]>`SELECT COUNT(*)::int AS count FROM orders WHERE rider_id=${input.participantId} AND status='DELIVERED' AND payment_status NOT IN ('REFUNDED','CANCELLED') AND placed_at>=${start} AND placed_at<${end}`;
      proofCount = Number(rows[0]?.count ?? 0);
    } else if (input.participantType === "CUSTOMER" && metric === "QUALIFIED_REFERRAL") {
      const rows = await tx<{count:number}[]>`SELECT COUNT(*)::int AS count FROM growth_event_ledger WHERE actor_id=${input.participantId} AND metric='QUALIFIED_REFERRAL' AND fraud_state='VERIFIED' AND occurred_at>=${start} AND occurred_at<${end}`;
      proofCount = Number(rows[0]?.count ?? 0);
    } else {
      throw new Error("GROWTH_METRIC_NOT_IMPLEMENTED");
    }
    const additional = Math.max(0, proofCount - verifiedAlready);
    const remainingTarget = Math.max(0, Number(campaign.target_qualifications) - verifiedAlready);
    const countToRecord = Math.min(additional, remainingTarget);
    if (countToRecord <= 0) return { accepted:false,status:"NO_NEW_QUALIFICATIONS",qualified:verifiedAlready,target:Number(campaign.target_qualifications) };
    const currentBudget = await tx<{spent:number}>`SELECT COALESCE(SUM(reward_paise),0)::bigint AS spent FROM growth_reward_ledger_v2 WHERE campaign_id=${campaign.id} AND status IN ('APPROVED','PAID')`;
    const remainingBudget = Math.max(0,Number(campaign.max_budget_paise)-Number(currentBudget[0]?.spent ?? 0));
    const rawReward = countToRecord * Number(campaign.reward_per_qualification_paise);
    const cappedReward = Math.min(rawReward,remainingBudget);
    const granted = Number(campaign.reward_per_qualification_paise)>0 ? Math.floor(cappedReward/Number(campaign.reward_per_qualification_paise)) : countToRecord;
    if (granted <= 0 && rawReward > 0) return { accepted:false,status:"CAMPAIGN_BUDGET_EXHAUSTED",qualified:verifiedAlready,target:Number(campaign.target_qualifications) };
    const eventId = randomUUID();
    const dedupeKey = `campaign:${campaign.id}:actor:${input.participantId}:metric:${metric}:window:${start.toISOString()}`;
    await tx`INSERT INTO growth_event_ledger(growth_event_id,campaign_id,user_id,actor_type,actor_id,metric,value,dedupe_key,occurred_at,verified_at,fraud_state,metadata) VALUES(${eventId},${campaign.id},${input.participantId},${input.participantType},${input.participantId},${metric},${granted},${dedupeKey},NOW(),NOW(),'VERIFIED',${JSON.stringify({proofCount,additional,periodStart:start.toISOString(),periodEnd:end.toISOString()})}) ON CONFLICT(dedupe_key) DO NOTHING`;
    await tx`INSERT INTO growth_reward_ledger_v2(campaign_id,user_id,source_growth_event_id,reward_paise,reward_coins,status,reason) VALUES(${campaign.id},${input.participantId},${eventId},${Math.max(0,cappedReward)},${granted*Number(campaign.reward_coins)},'PENDING','Target qualification verified from production order/ledger evidence') ON CONFLICT(source_growth_event_id) DO NOTHING`;
    return { accepted:true,status:"PENDING_REWARD_APPROVAL",qualified:verifiedAlready+granted,target:Number(campaign.target_qualifications),rewardPaise:Math.max(0,cappedReward),rewardCoins:granted*Number(campaign.reward_coins) };
  });
}
export async function recordActiveTargetQualification(input: { participantType: GrowthParticipant; participantId: string }) {
  const sql = await getSql();
  const campaigns = await sql<{ id: string }>`
    SELECT id
    FROM growth_campaigns
    WHERE active = true
      AND participant_type = ${input.participantType}
      AND target_metric = 'DELIVERED_ORDER'
    ORDER BY starts_at DESC
    LIMIT 1
  `;
  const campaign = campaigns[0];
  if (!campaign) return { accepted: false as const, status: "NO_ACTIVE_TARGET_CAMPAIGN" as const };
  return recordTargetQualification({
    campaignId: campaign.id,
    participantType: input.participantType,
    participantId: input.participantId,
  });
}
