
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type ReferralStats = {
  referralCode: string;
  shareUrl: string;
  totalInvited: number;
  totalEarnedPaise: number;
  rewardPerFriendPaise: number;
  friendDiscountPaise: number;
  minOrderPaise: number;
};

export const getReferralStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ReferralStats> => {
    const sql = await getSql();
    const userId = context.userId;

    // Use the server-side referral code that is actually stored for this user.
    // Never display a client-derived code that the referral attribution table cannot resolve.
    let referralCode = "";
    try {
      const rows = await sql<{ referral_code: string | null }>`
        select referral_code from users where id = ${userId} limit 1
      `;
      referralCode = rows[0]?.referral_code ?? "";
    } catch {
      referralCode = "";
    }

    // Query referral redemption stats from DB if available
    let totalInvited = 0;
    let totalEarnedPaise = 0;
    try {
      const rows = await sql<{ count: number; earned: number }>`
        select count(*)::int as count, coalesce(sum(delta), 0)::int as earned
        from loyalty_transactions
        where user_id = ${userId} and reason like 'referral%'
      `;
      if (rows[0]) {
        totalInvited = rows[0].count;
        totalEarnedPaise = rows[0].earned * 100; // 1 point = 100 paise (₹1)
      }
    } catch {
      // Fallback if table doesn't have loyalty transactions yet
    }

    return {
      referralCode,
      shareUrl: `https://orderking.in/?ref=${referralCode}`,
      totalInvited,
      totalEarnedPaise,
      // No reward amount is promised until a live campaign is configured and its
      // qualifying order/payment rules are verified.
      rewardPerFriendPaise: 0,
      friendDiscountPaise: 0,
      minOrderPaise: 0,
    };
  });
