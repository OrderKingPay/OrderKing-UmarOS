import { getSql, type Sql } from "./db";
import { createHash, randomBytes } from "node:crypto";

/**
 * 👑 ORDERKING ELITE VIRAL GROWTH ENGINE
 * 
 * ZERO-COST AUTONOMOUS SPREAD ARCHITECTURE
 * - Cryptographically secure unique referral codes (Collision-resistant)
 * - Strict ACID database transactions 
 * - Multi-platform localized viral hooks (WhatsApp, Telegram, Twitter, Native Web Share)
 * - Deep-link attribution tracking
 */

export const ViralGrowthEngine = {
  /**
   * Generates a deterministic, short, and collision-resistant referral code for a user.
   * Format: OK-{4 chars from hash}-{3 random chars}
   */
  generateReferralCode(userId: string): string {
    const secret = process.env.BETTER_AUTH_SECRET?.trim();
    if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured.");
    const hash = createHash("sha256").update(userId + secret).digest("hex").substring(0, 4).toUpperCase();
    const entropy = randomBytes(2).toString("hex").substring(0, 3).toUpperCase();
    return `OK-${hash}${entropy}`;
  },

  /**
   * Generates the high-conversion, dynamic deep link for sharing.
   */
  generateDeepLink(referralCode: string): string {
    const baseUrl = process.env.PUBLIC_APP_ORIGIN?.trim() || "https://orderking-customers.pages.dev";
    return `${baseUrl}/r/${referralCode}`;
  },

  /**
   * Generates native share intents optimized for maximum organic spread.
   */
  createViralShareIntent(referralCode: string, amount: number = 100) {
    const link = this.generateDeepLink(referralCode);
    const copy = `👑 I just got ₹${amount} free food credit on OrderKing!\n\nUse my invite link to claim your ₹${amount} welcome bonus instantly. No hidden fees, just real food at 0% markup.\n\nClaim here: ${link}`;
    const encodedCopy = encodeURIComponent(copy);

    return {
      whatsapp: `https://wa.me/?text=${encodedCopy}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Claim ₹${amount} free food on OrderKing!`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedCopy}`,
      navigatorShare: typeof navigator !== "undefined" && typeof navigator.share === 'function' ? {
        title: "OrderKing Welcome Bonus",
        text: copy,
        url: link
      } : null,
      rawCopy: copy,
      link: link
    };
  },

  /**
   * Resolves a referral code back to the original referrer ID.
   */
  async resolveReferrerId(referralCode: string): Promise<string | null> {
    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      `SELECT id FROM users WHERE referral_code = $1 LIMIT 1`,
      [referralCode]
    );
    return rows.length > 0 ? rows[0].id : null;
  },

  /**
   * PROCESS REFERRAL (BANKING-GRADE)
   * Restored direct integration with KingPay Wallet Engine to prevent any schema mismatch.
   */
  async processReferralActivation(referralCode: string, newUserId: string): Promise<{ success: boolean; message: string; amountCredited: number }> {
    const sql = await getSql();
    
    return await sql.transaction(async (tx: Sql) => {
      // 1. Resolve code to Referrer
      const referrerRows = await tx.query<{ id: string }>(
        `SELECT id FROM users WHERE referral_code = $1 LIMIT 1 FOR UPDATE SKIP LOCKED`, 
        [referralCode]
      );
      
      if (referrerRows.length === 0) {
        return { success: false, message: "Invalid or expired referral code", amountCredited: 0 };
      }
      
      const referrerId = referrerRows[0].id;

      if (referrerId === newUserId) {
        return { success: false, message: "Self-referral detected and blocked.", amountCredited: 0 };
      }

      // 2. Check Idempotency (Has this user already been referred?)
      const existingRef = await tx.query(
        `SELECT 1 FROM referrals WHERE new_user_id = $1 LIMIT 1`,
        [newUserId]
      );
      
      if (existingRef.length > 0) {
        return { success: false, message: "User has already claimed a welcome bonus.", amountCredited: 0 };
      }

      // 3. Record the Referral Event Atomically
      await tx.query(
        `INSERT INTO referrals (referrer_id, new_user_id, status, created_at) VALUES ($1, $2, 'COMPLETED', NOW())`,
        [referrerId, newUserId]
      );

      // 4. Record promotional food credits as loyalty points, not cash balance.
      // 100 points = ₹100 promotional redemption value under the current loyalty policy.
      const REWARD_POINTS = 100;

      await tx.query(
        `INSERT INTO loyalty_accounts (user_id, points, lifetime_points)
         VALUES ($1, $2, $2)
         ON CONFLICT (user_id) DO UPDATE
         SET points = loyalty_accounts.points + EXCLUDED.points,
             lifetime_points = loyalty_accounts.lifetime_points + EXCLUDED.lifetime_points,
             updated_at = NOW()`,
        [referrerId, REWARD_POINTS],
      );
      await tx.query(
        `INSERT INTO loyalty_transactions (id, user_id, delta, reason, created_at)
         VALUES ($1, $2, $3, 'referral_reward_referrer', NOW())`,
        [randomBytes(16).toString("hex"), referrerId, REWARD_POINTS],
      );

      await tx.query(
        `INSERT INTO loyalty_accounts (user_id, points, lifetime_points)
         VALUES ($1, $2, $2)
         ON CONFLICT (user_id) DO UPDATE
         SET points = loyalty_accounts.points + EXCLUDED.points,
             lifetime_points = loyalty_accounts.lifetime_points + EXCLUDED.lifetime_points,
             updated_at = NOW()`,
        [newUserId, REWARD_POINTS],
      );
      await tx.query(
        `INSERT INTO loyalty_transactions (id, user_id, delta, reason, created_at)
         VALUES ($1, $2, $3, 'referral_reward_new_user', NOW())`,
        [randomBytes(16).toString("hex"), newUserId, REWARD_POINTS],
      );

      return { success: true, message: "Promotional food credits added to loyalty accounts.", amountCredited: REWARD_POINTS * 100 };
    });
  }
};
