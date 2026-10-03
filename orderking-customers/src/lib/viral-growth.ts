import { getSql, type Sql } from "./db";
import { createHash, randomBytes } from "node:crypto";

/**
 * Referral attribution and reward engine.
 *
 * All referral identity, attribution, and wallet credits use the same Better Auth
 * user table and canonical KingPay wallet ledger.
 */
export const ViralGrowthEngine = {
  generateReferralCode(userId: string): string {
    const secret =
      typeof process !== "undefined" && process.env.BETTER_AUTH_SECRET
        ? process.env.BETTER_AUTH_SECRET
        : "default_secret";
    const hash = createHash("sha256")
      .update(userId + secret)
      .digest("hex")
      .substring(0, 4)
      .toUpperCase();
    const entropy = randomBytes(2).toString("hex").substring(0, 3).toUpperCase();
    return `OK-${hash}${entropy}`;
  },

  generateDeepLink(referralCode: string): string {
    const baseUrl =
      typeof process !== "undefined" && process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://orderking.in";
    return `${baseUrl}/?ref=${encodeURIComponent(referralCode)}`;
  },

  createViralShareIntent(referralCode: string, amount: number = 100) {
    const link = this.generateDeepLink(referralCode);
    const copy = `Join me on OrderKing using my referral link. Eligible referral rewards are credited after OrderKing verifies the activation.\n\n${link}`;
    const encodedCopy = encodeURIComponent(copy);

    return {
      whatsapp: `https://wa.me/?text=${encodedCopy}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join me on OrderKing")}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedCopy}`,
      navigatorShare:
        typeof navigator !== "undefined" && typeof navigator.share === "function"
          ? { title: "OrderKing referral", text: copy, url: link }
          : null,
      rawCopy: copy,
      link,
      rewardAmountPaise: amount * 100,
    };
  },

  async resolveReferrerId(referralCode: string): Promise<string | null> {
    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      `SELECT id FROM "user" WHERE referral_code = $1 LIMIT 1`,
      [referralCode.trim().toUpperCase()],
    );
    return rows.length > 0 ? rows[0].id : null;
  },

  async processReferralActivation(
    referralCode: string,
    newUserId: string,
  ): Promise<{ success: boolean; message: string; amountCredited: number }> {
    const sql = await getSql();

    return await sql.transaction(async (tx: Sql) => {
      const code = referralCode.trim().toUpperCase();
      const referrerRows = await tx.query<{ id: string }>(
        `SELECT id FROM "user" WHERE referral_code = $1 LIMIT 1 FOR UPDATE SKIP LOCKED`,
        [code],
      );

      if (referrerRows.length === 0) {
        return { success: false, message: "Invalid or expired referral code", amountCredited: 0 };
      }

      const referrerId = referrerRows[0].id;
      if (referrerId === newUserId) {
        return { success: false, message: "Self-referral detected and blocked.", amountCredited: 0 };
      }

      const existingRef = await tx.query<{ id: string }>(
        `SELECT id FROM referrals WHERE new_user_id = $1 LIMIT 1`,
        [newUserId],
      );
      if (existingRef.length > 0) {
        return { success: false, message: "User has already claimed a welcome bonus.", amountCredited: 0 };
      }

      const referrerCreditId = `ref_reward_${referrerId}_${newUserId}`;
      const newUserCreditId = `ref_reward_welcome_${newUserId}_${referrerId}`;
      const rewardPaise = 10_000;

      const creditWallet = async (userId: string, transactionId: string, description: string) => {
        const already = await tx<{ id: string }>`
          select id from kingpay_transactions where id = ${transactionId} limit 1
        `;
        if (already[0]) return "already_processed" as const;

        await tx`
          insert into kingpay_wallets (user_id, balance_paise, king_coins)
          values (${userId}, 0, 0)
          on conflict (user_id) do nothing
        `;

        const wallets = await tx<{ balance_paise: number }>`
          select balance_paise
          from kingpay_wallets
          where user_id = ${userId}
          for update
        `;
        if (!wallets[0]) throw new Error("KingPay wallet could not be created.");

        await tx`
          update kingpay_wallets
          set balance_paise = balance_paise + ${rewardPaise}, updated_at = now()
          where user_id = ${userId}
        `;

        await tx`
          insert into kingpay_transactions (id, user_id, amount_paise, type, description)
          values (${transactionId}, ${userId}, ${rewardPaise}, 'CREDIT', ${description})
        `;

        return "success" as const;
      };

      const referrerCredit = await creditWallet(
        referrerId,
        referrerCreditId,
        `Verified referral reward: ${newUserId}`,
      );
      const newUserCredit = await creditWallet(
        newUserId,
        newUserCreditId,
        `Verified referral welcome credit: ${referrerId}`,
      );

      await tx.query(
        `INSERT INTO referrals (id, referrer_id, new_user_id, status, created_at)
         VALUES ($1, $2, $3, 'COMPLETED', NOW())`,
        [`ref_${referrerId}_${newUserId}`, referrerId, newUserId],
      );

      if (referrerCredit === "success" || newUserCredit === "success") {
        return {
          success: true,
          message: "Referral activation verified and rewards credited.",
          amountCredited: rewardPaise,
        };
      }

      return {
        success: true,
        message: "Referral activation was already credited.",
        amountCredited: rewardPaise,
      };
    });
  },
};
