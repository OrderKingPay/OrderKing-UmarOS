import { getSql } from "@/lib/db";

export class ViralGrowthEngine {
  /**
   * Creates an aggressive, localized WhatsApp sharing link that triggers a dual-sided monetary reward.
   * @param userId The ID of the referring user
   * @param offerCode The unique offer code for the viral campaign
   * @returns The generated WhatsApp sharing URL
   */
  public static generateWhatsAppViralLink(userId: string, offerCode: string): string {
    const baseUrl = "https://orderkingpay.com/join";
    // Aggressive viral hook to force explosive user acquisition
    const message = `Claim your ₹500 instant bonus on OrderKing! 🚀 I just ordered free food. Use my VIP invite code ${offerCode} before it expires. Download now!`;
    const encodedMessage = encodeURIComponent(message);
    const referralLink = encodeURIComponent(`${baseUrl}?ref=${userId}&code=${offerCode}`);

    return `https://wa.me/?text=${encodedMessage}%20${referralLink}`;
  }

  /**
   * Mathematically logs the successful conversion and instantly updates both users' wallets in the Postgres DB.
   * Funded by RESTAURANT_AD_REVENUE to force explosive user acquisition.
   * @param referrerId The ID of the user who sent the referral
   * @param newUserId The ID of the newly registered user
   */
  public static async processViralReferral(referrerId: string, newUserId: string): Promise<void> {
    const sql = await getSql();

    try {
      await sql.transaction(async (sqlTransaction: any) => {
        // 1. Deduct from Restaurant Ad Revenue Ledger to fund the acquisition
        await sqlTransaction`
          UPDATE system_ledgers
          SET balance = balance - 1000.00, updated_at = NOW()
          WHERE ledger_name = 'RESTAURANT_AD_REVENUE';
        `;

        // 2. Update referrer's wallet
        await sqlTransaction`
          UPDATE wallets 
          SET balance = balance + 500.00, updated_at = NOW() 
          WHERE user_id = ${referrerId};
        `;

        await sqlTransaction`
          INSERT INTO wallet_transactions (user_id, amount, type, description, created_at)
          VALUES (${referrerId}, 500.00, 'CREDIT', 'WhatsApp Viral Referral Bonus - Ad Funded', NOW());
        `;

        // 3. Update new user's wallet
        await sqlTransaction`
          UPDATE wallets 
          SET balance = balance + 500.00, updated_at = NOW() 
          WHERE user_id = ${newUserId};
        `;

        await sqlTransaction`
          INSERT INTO wallet_transactions (user_id, amount, type, description, created_at)
          VALUES (${newUserId}, 500.00, 'CREDIT', 'WhatsApp Viral Welcome Bonus - Ad Funded', NOW());
        `;

        // 4. Log the viral referral analytically
        await sqlTransaction`
          INSERT INTO viral_conversions (referrer_id, converted_user_id, reward_amount, funding_source, created_at)
          VALUES (${referrerId}, ${newUserId}, 1000.00, 'RESTAURANT_AD_REVENUE', NOW());
        `;
      });
      
      console.log(`[VIRAL ENGINE] EXPLOSIVE GROWTH: Successfully processed referral: ${referrerId} -> ${newUserId}. 1000.00 total injected from Ad Revenue.`);
    } catch (error) {
      console.error(`[VIRAL ENGINE] Failed to process referral from ${referrerId} for ${newUserId}:`, error);
      throw error;
    }
  }
}
