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
   * Predictive loyalty reminder engine.
   * Uses observed ordering patterns to time a contextual reminder.
   * Does not fabricate discounts, VIP entitlements, or guaranteed outcomes.
   */
  public static async calculateAndDispatchCravingOffers(
    users: UserOrderHistory[],
    vapidPublicKey: string,
    vapidPrivateKey: string
  ): Promise<number> {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    let dispatchedCount = 0;

    for (const user of users) {
      // Check if they usually order in the NEXT hour on this specific day
      if (user.mostFrequentDay === currentDay && user.mostFrequentHour === (currentHour + 1) % 24) {
        
        // Construct a factual loyalty reminder. Any offer must come from a canonical offer service.
        const pushSubject = 'mailto:founder@orderking.in';
        user.pushEndpoint.title = 'OrderKing reminder';
        user.pushEndpoint.body = `Based on your usual ordering time, your favorite item ${user.favoriteItemName} may be a good choice when you are ready to order.`;
        user.pushEndpoint.url = '/';

        // Fire natively via Antigravity Marketing Engine (No 3rd party SDKs)
        const success = await AntigravityMarketing.sendWebPush(
          user.pushEndpoint, 
          vapidPublicKey, 
          vapidPrivateKey, 
          pushSubject
        );

        if (success) dispatchedCount++;
      }
    }

    return dispatchedCount;
  }
}
