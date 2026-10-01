import { getSql, type Sql } from "@/lib/db";
import { randomUUID } from "node:crypto";

type Campaign = {
  id: string;
  reward_per_qualification_paise: number;
  target_qualifications: number;
  max_budget_paise: number;
  min_order_paise: number;
};

export async function qualifyReferralOrder(inviteeUserId: string, orderId: string) {
  const sql = await getSql();
  return sql.transaction(async (tx: Sql) => {
    const orderRows = await tx<{ total_paise: number; status: string; payment_status: string; customer_id: string }>`
      SELECT total_paise, status, payment_status, customer_id
      FROM orders WHERE id = ${orderId} FOR UPDATE
    `;
    const order = orderRows[0];
    if (!order || order.customer_id !== inviteeUserId) return { qualified: false, rewardPaise: 0 };
    if (order.status !== "DELIVERED") return { qualified: false, rewardPaise: 0 };
    if (["CANCELLED","REFUNDED","PAYMENT_FAILED"].includes(order.payment_status)) return { qualified: false, rewardPaise: 0 };

    const signup = await tx<{ campaign_id: string; referrer_user_id: string; referral_code: string }>`
      SELECT e.campaign_id, e.referrer_user_id, c.referral_code
      FROM growth_referral_events e
      JOIN growth_referral_codes c ON c.user_id = e.referrer_user_id
      WHERE e.invitee_user_id = ${inviteeUserId}
        AND e.event_type = 'SIGNUP'
        AND c.active = true
      ORDER BY e.created_at ASC
      LIMIT 1
    `;
    if (!signup[0]) return { qualified: false, rewardPaise: 0 };

    const campaignRows = await tx<Campaign>`
      SELECT id, reward_per_qualification_paise, target_qualifications,
             max_budget_paise, min_order_paise
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

    const existing = await tx`
      SELECT id FROM growth_referral_events
      WHERE campaign_id = ${campaign.id}
        AND invitee_user_id = ${inviteeUserId}
        AND event_type = 'QUALIFIED_ORDER'
      LIMIT 1
    `;
    if (existing.length) return { qualified: false, rewardPaise: 0 };

    const used = await tx<{ total: number; count: number }>`
      SELECT COALESCE(SUM(amount_paise),0)::bigint AS total,
             COUNT(*)::int AS count
      FROM growth_bonus_ledger
      WHERE campaign_id = ${campaign.id} AND status = 'POSTED'
    `;
    const totalUsed = Number(used[0]?.total || 0);
    const countUsed = Number(used[0]?.count || 0);
    if (countUsed >= Number(campaign.target_qualifications)) {
      return { qualified: false, rewardPaise: 0 };
    }

    const reward = Math.min(
      Number(campaign.reward_per_qualification_paise),
      Math.max(0, Number(campaign.max_budget_paise) - totalUsed),
    );
    if (reward <= 0) return { qualified: false, rewardPaise: 0 };

    const eventId = randomUUID();
    await tx`
      INSERT INTO growth_referral_events
        (id, campaign_id, referral_code, referrer_user_id, invitee_user_id,
         event_type, order_id, amount_paise, qualified_at, metadata)
      VALUES
        (${eventId}, ${campaign.id}, ${signup[0].referral_code},
         ${signup[0].referrer_user_id}, ${inviteeUserId}, 'QUALIFIED_ORDER',
         ${orderId}, ${order.total_paise}, now(), '{}'::jsonb)
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
      SET balance_paise = balance_paise + ${reward}, updated_at = now()
      WHERE user_id = ${signup[0].referrer_user_id}
    `;
    await tx`
      INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
      VALUES (
        ${"ref_" + eventId},
        ${signup[0].referrer_user_id},
        ${reward},
        'CREDIT',
        ${"Verified referral reward for qualified order " + orderId}
      )
    `;
    await tx`
      INSERT INTO growth_bonus_ledger
        (id, campaign_id, event_id, user_id, amount_paise, status, reason)
      VALUES (
        ${"bonus_" + eventId},
        ${campaign.id},
        ${eventId},
        ${signup[0].referrer_user_id},
        ${reward},
        'POSTED',
        ${"Delivered qualifying referral order " + orderId}
      )
    `;

    return { qualified: true, rewardPaise: reward };
  });
}
