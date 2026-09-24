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

    // Derive deterministic, user-friendly referral code
    const shortHash = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase() || "VIP26";
    const referralCode = `KING${shortHash}`;

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
      rewardPerFriendPaise: 2_500, // ₹25 wallet credit for referrer (drives repeat order)
      friendDiscountPaise: 4_000, // ₹40 OFF for friend (completely covered by commission)
      minOrderPaise: 24_900, // ₹249 min order (guarantees positive platform profit on every order)
    };
  });
