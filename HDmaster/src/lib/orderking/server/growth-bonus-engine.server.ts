// @ts-nocheck
import { getSql } from "@/lib/db";

export type GrowthAudience = "CUSTOMER" | "PARTNER" | "RIDER";

export async function evaluateVerifiedGrowthBonus(input: {
  audienceType: GrowthAudience;
  actorId: string;
  metric: string;
  verifiedOrderPaise?: number;
}) {
  const sql = await getSql();
  const rows = await sql<{ id:string; campaign_id:string|null; threshold:number; bonus_paise:number; max_bonus_paise:number; min_verified_order_paise:number }>\`
    SELECT id, campaign_id, threshold, bonus_paise, max_bonus_paise, min_verified_order_paise
    FROM growth_bonus_targets
    WHERE audience_type=\${input.audienceType}
      AND metric=\${input.metric}
      AND active=true
      AND starts_at<=NOW()
      AND (ends_at IS NULL OR ends_at>NOW())
      AND COALESCE(\${input.verifiedOrderPaise ?? 0},0)>=min_verified_order_paise
    ORDER BY threshold DESC
    LIMIT 1
  \`;
  const target = rows[0];
  if (!target) return { eligible:false, bonusPaise:0, reason:"NO_ACTIVE_TARGET" };

  const completed = await sql<{ count:number }>\`
    SELECT COUNT(*)::int AS count
    FROM growth_event_ledger
    WHERE actor_id=\${input.actorId}
      AND metric=\${input.metric}
      AND fraud_state='VERIFIED'
  \`;
  const achievedCount = Number(completed[0]?.count ?? 0);
  if (achievedCount < Number(target.threshold)) {
    return {
      eligible:false,
      bonusPaise:0,
      remaining:Number(target.threshold)-achievedCount,
      reason:"TARGET_NOT_REACHED"
    };
  }

  const existing = await sql<{ total:number }>\`
    SELECT COALESCE(SUM(reward_paise),0)::bigint AS total
    FROM growth_reward_ledger_v2
    WHERE user_id::text=\${input.actorId}
      AND status IN ('PAID','PENDING')
      AND campaign_id=\${target.campaign_id}
  \`;
  const issued = Number(existing[0]?.total ?? 0);
  const remainingBudget = Math.max(0, Number(target.max_bonus_paise)-issued);
  const bonus = Math.min(Number(target.bonus_paise), remainingBudget);
  if (bonus<=0) return { eligible:false, bonusPaise:0, reason:"TARGET_BUDGET_EXHAUSTED" };

  const rewardId = \`target_\${target.id}_\${input.actorId}_\${achievedCount}\`;
  const inserted = await sql<{ id:string }>\`
    INSERT INTO growth_reward_ledger_v2 (
      id,campaign_id,user_id,reward_paise,reward_coins,status,reason
    )
    VALUES (
      \${rewardId},\${target.campaign_id},\${input.actorId},\${bonus},0,'PENDING',
      'Verified target threshold reached'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  \`;

  return {
    eligible:Boolean(inserted[0]),
    bonusPaise:inserted[0] ? bonus : 0,
    status:"PENDING_REWARD_VERIFICATION",
    threshold:Number(target.threshold),
    achievedCount
  };
}
