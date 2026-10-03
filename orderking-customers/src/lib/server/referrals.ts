
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { createHash } from "node:crypto";
import { ViralGrowthEngine } from "@/lib/viral-growth";

export type ReferralStats = {
  referralCode: string;
  shareUrl: string;
  totalInvited: number;
  totalEarnedPaise: number;
  rewardPerFriendPaise: number;
  friendWelcomeCreditPaise: number;
  minOrderPaise: number;
};

export const claimReferralCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .// @ts-ignore current TanStack Start validator API differs across pinned runtime versions
  validator((input: { referralCode: string }) => input)
  .handler(async ({ context, data }) => {
    const code = data.referralCode.trim().toUpperCase();
    if (!code || code.length > 64) throw new Error("Invalid referral code.");
    const result = await ViralGrowthEngine.processReferralActivation(code, context.userId);
    if (!result.success) throw new Error(result.message);
    return result;
  });

export const getReferralStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ReferralStats> => {
    const sql = await getSql();
    const userId = context.userId;

    const existing = await sql<{ referral_code: string | null }>`
      select referral_code from "user" where id = ${userId} limit 1
    `;
    if (!existing[0]) throw new Error("Account not found.");

    let referralCode = existing[0].referral_code?.trim() ?? "";
    if (!referralCode) {
      const stable = createHash("sha256").update(userId).digest("hex").slice(-8).toUpperCase();
      referralCode = `OK-${stable}`;
      const collision = await sql<{ id: string }>`
        select id from "user" where referral_code = ${referralCode} and id <> ${userId} limit 1
      `;
      if (collision[0]) throw new Error("Referral code allocation is temporarily unavailable.");
      await sql`
        update "user" set referral_code = ${referralCode}
        where id = ${userId} and (referral_code is null or trim(referral_code) = '')
      `;
    }

    const rows = await sql<{ count: number; earned: number }>`
      select
        (select count(*)::int from referrals where referrer_id = ${userId} and status = 'COMPLETED') as count,
        coalesce((
          select sum(amount_paise)::bigint
          from kingpay_transactions
          where user_id = ${userId}
            and type = 'CREDIT'
            and description like 'Verified referral reward:%'
        ), 0)::bigint as earned
    `;
    const totalInvited = rows[0]?.count ?? 0;
    const totalEarnedPaise = Number(rows[0]?.earned ?? 0);
    const verifiedRewardPaise = 10_000;
    return {
      referralCode,
      shareUrl: `https://orderking.in/?ref=${encodeURIComponent(referralCode)}`,
      totalInvited,
      totalEarnedPaise,
      rewardPerFriendPaise: verifiedRewardPaise,
      friendWelcomeCreditPaise: verifiedRewardPaise,
      minOrderPaise: 0,
    };
  });
