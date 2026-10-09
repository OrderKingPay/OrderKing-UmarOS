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
    const message = `Claim your ₹500 instant bonus on OrderKing! 🚀 Use my VIP invite code ${offerCode} before it expires. Download now!`;
    const encodedMessage = encodeURIComponent(message);
    const referralLink = encodeURIComponent(`${baseUrl}?ref=${userId}&code=${offerCode}`);

    return `https://wa.me/?text=${encodedMessage}%20${referralLink}`;
  }

  /**
   * Mathematically logs the successful conversion and instantly updates both users' wallets in the Postgres DB.
   * @param referrerId The ID of the user who sent the referral
   * @param newUserId The ID of the newly registered user
   */
  public static async processViralReferral(referrerId: string, newUserId: string): Promise<void> {
    const sql = await getSql();

    try {
      await sql.transaction(async (sqlTransaction: any) => {
        // Update referrer's wallet
        await sqlTransaction`
          UPDATE wallets 
          SET balance = balance + 500.00, updated_at = NOW() 
          WHERE user_id = ${referrerId};
        `;

        // Update new user's wallet
        await sqlTransaction`
          UPDATE wallets 
          SET balance = balance + 500.00, updated_at = NOW() 
          WHERE user_id = ${newUserId};
        `;

        // Log the viral referral mathematically/analytically
        await sqlTransaction`
          INSERT INTO viral_conversions (referrer_id, converted_user_id, reward_amount, created_at)
          VALUES (${referrerId}, ${newUserId}, 500.00, NOW());
        `;
      });
      
      console.log(`[VIRAL ENGINE] Successfully processed referral: ${referrerId} -> ${newUserId}`);
    } catch (error) {
      console.error(`[VIRAL ENGINE] Failed to process referral from ${referrerId} for ${newUserId}:`, error);
      throw error;
    }
  }
}
