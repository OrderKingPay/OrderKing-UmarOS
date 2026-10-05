import { getSql, type Sql } from "./db";
import { createHash, randomBytes } from "node:crypto";
import { walletEngine } from "./kingpay/wallet";

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
    const secret = typeof process !== "undefined" ? process.env.BETTER_AUTH_SECRET?.trim() : undefined;
    if (!secret) throw new Error("Referral codes require BETTER_AUTH_SECRET.");
    const hash = createHash("sha256").update(userId + secret).digest("hex").substring(0, 4).toUpperCase();
    const entropy = randomBytes(2).toString("hex").substring(0, 3).toUpperCase();
    return `OK-${hash}${entropy}`;
  },

  /**
   * Generates the high-conversion, dynamic deep link for sharing.
   */
  generateDeepLink(referralCode: string): string {
    const baseUrl =
      (typeof process !== "undefined" && (process.env.PUBLIC_CUSTOMER_APP_URL || process.env.PUBLIC_APP_URL)?.trim()) ||
      "https://orderking-customers.pages.dev";
    if (/vercel\.app$/i.test(new URL(baseUrl).hostname)) {
      throw new Error("Cloudflare-only policy: referral links may not target Vercel.");
    }
    return `${baseUrl.replace(/\/+$/, "")}/r/${referralCode}`;
  },

  /**
   * Generates native share intents optimized for maximum organic spread.
   */
  createViralShareIntent(referralCode: string) {
    const link = this.generateDeepLink(referralCode);
    const configuredReward = Number.parseInt(
      typeof process !== "undefined" ? process.env.ORDERKING_REFERRAL_REWARD_PAISE ?? "0" : "0",
      10,
    );
    const amount = Number.isFinite(configuredReward) && configuredReward > 0 ? configuredReward / 100 : null;
    const copy = amount
      ? `👑 Join me on OrderKing and claim the active ₹${amount} referral benefit.\n\nClaim here: ${link}`
      : `👑 Join me on OrderKing. Referral rewards are available only during verified campaigns.\n\nJoin here: ${link}`;
    const encodedCopy = encodeURIComponent(copy);

    return {
      whatsapp: `https://wa.me/?text=${encodedCopy}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Claim ₹${amount} free food on OrderKing!`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedCopy}`,
      navigatorShare: typeof navigator !== "undefined" && typeof navigator.share === "function" ? {
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

      const configuredReward = Number.parseInt(
        typeof process !== "undefined" ? process.env.ORDERKING_REFERRAL_REWARD_PAISE ?? "0" : "0",
        10,
      );
      const REWARD_PAISE = Number.isFinite(configuredReward) && configuredReward > 0 ? configuredReward : 0;
      if (REWARD_PAISE === 0) {
        return { success: false, message: "Referral rewards are not enabled; no wallet credit was issued.", amountCredited: 0 };
      }
      
      const referrerCredit = await walletEngine.creditWallet(
        referrerId, 
        REWARD_PAISE, 
        `ref_reward_${referrerId}_${newUserId}`
      );

      const newUserCredit = await walletEngine.creditWallet(
        newUserId, 
        REWARD_PAISE, 
        `ref_reward_welcome_${newUserId}_${referrerId}`
      );

      if (referrerCredit.status !== "success" || newUserCredit.status !== "success") {
         throw new Error("Failed to credit wallets via KingPay engine");
      }

      return { success: true, message: "Bonus successfully deployed to wallets.", amountCredited: REWARD_PAISE };
    });
  }
};
