import { getSql } from '@/lib/db';
import { AntigravityMarketing, WebPushPayload } from './antigravity-marketing';

export interface UserOrderHistory {
  userId: string;
  favoriteItemId: string;
  favoriteItemName: string;
  mostFrequentHour: number; // 0-23
  mostFrequentDay: number; // 0-6 (Sunday-Saturday)
  pushEndpoint: WebPushPayload;
}

export class PredictiveLoyaltyEngine {
  /**
   * VIP Addiction Engine.
   * Analyzes order history to find exact biological craving times.
   * Dispatches a highly personalized discount 15 minutes before they usually order.
   * Also checks for expiring KING_PASS subscriptions and sends renewal offers.
   */
  public static async calculateAndDispatchCravingOffers(
    users: UserOrderHistory[],
    vapidPublicKey: string,
    vapidPrivateKey: string
  ): Promise<{ dispatchedOffers: number; dispatchedRenewals: number }> {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    let dispatchedOffers = 0;
    let dispatchedRenewals = 0;

    const sql = await getSql();

    for (const user of users) {
      // 1. KING_PASS Renewal Check
      // Check if user has an active KING_PASS expiring in the next 3 days
      const subscriptions = await sql.query<{ id: string; plan_name: string; valid_until: Date }>(
        `SELECT id, plan_name, valid_until FROM customer_subscriptions 
         WHERE customer_id = $1 AND status = 'ACTIVE' 
         AND valid_until > NOW() AND valid_until < NOW() + INTERVAL '3 days'
         LIMIT 1`,
        [user.userId]
      );

      if (subscriptions.length > 0) {
        // Construct the KING_PASS Renewal Push
        const pushSubject = 'mailto:founder@orderking.in';
        const renewalPush: WebPushPayload = {
          ...user.pushEndpoint,
          title: '👑 Keep Your King Pass Benefits',
          body: `Your free delivery and VIP perks expire soon! Renew now to keep saving on every order.`,
          url: '/kingpass/renew',
        };

        const success = await AntigravityMarketing.sendWebPush(
          renewalPush, 
          vapidPublicKey, 
          vapidPrivateKey, 
          pushSubject
        );

        if (success) dispatchedRenewals++;
      } else {
        // 2. Margin-Maximized Upsells
        // If not renewing, check biological craving times
        if (user.mostFrequentDay === currentDay && user.mostFrequentHour === (currentHour + 1) % 24) {
          
          // Construct the VIP Push Notification with a high-margin add-on
          const pushSubject = 'mailto:founder@orderking.in';
          const offerPush: WebPushPayload = {
            ...user.pushEndpoint,
            title: '👑 VIP Secret Offer',
            body: `Craving ${user.favoriteItemName}? Order in the next 30 mins and add a cold beverage for just ₹10!`,
            url: '/vip-checkout',
          };

          // Fire natively via Antigravity Marketing Engine (No 3rd party SDKs)
          const success = await AntigravityMarketing.sendWebPush(
            offerPush, 
            vapidPublicKey, 
            vapidPrivateKey, 
            pushSubject
          );

          if (success) dispatchedOffers++;
        }
      }
    }

    return { dispatchedOffers, dispatchedRenewals };
  }
}
