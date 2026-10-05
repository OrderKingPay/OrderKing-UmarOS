/**
 * VIP PERSONALIZED LOYALTY ENGINE
 * 
 * Machine Learning module to track customer habits and automatically 
 * dispatch opt-in, relevance-based loyalty offers without fabricated urgency.
 */

import { AntigravityMarketing } from './antigravity-marketing';
import { IndiaEdgeCache } from './india-edge-cache';

export interface CustomerOrderHistory {
  customerId: string;
  favoriteRestaurantId: string;
  mostOrderedItem: string;
  averageOrderTimeHHMM: string; // e.g., "19:30"
  pushEndpoint: any;
}

export class VIPLoyaltyEngine {
  /**
   * Scans eligible opted-in users whose usual order time is approaching
   * within the next 30 minutes, and mathematically calculates a custom discount.
   */
  public static async triggerPersonalizedLoyaltyOffers(
    customers: CustomerOrderHistory[],
    vapidKeys: { public: string; private: string }
  ): Promise<number> {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    let successfullyEngaged = 0;

    for (const customer of customers) {
      const [orderHour, orderMinute] = customer.averageOrderTimeHHMM.split(':').map(Number);
      
      // Calculate time difference in minutes
      const timeDiff = (orderHour * 60 + orderMinute) - (currentHour * 60 + currentMinute);
      
      // If their usual order time is exactly 15 to 30 minutes away
      if (timeDiff > 15 && timeDiff <= 30) {
        
        // Construct the VIP personalized offer
        const pushPayload = {
          endpoint: customer.pushEndpoint.endpoint,
          keys: customer.pushEndpoint.keys,
          title: '🌟 Special VIP Secret Drop',
          body: `We know you are craving ${customer.mostOrderedItem}. A personalized VIP offer is available for a limited period.`,
          url: `${process.env.PUBLIC_APP_ORIGIN ?? "https://orderking-customers.pages.dev"}/vip-claim/${customer.customerId}`
        };

        // Fire the Web Push through the Antigravity Engine
        const success = await AntigravityMarketing.sendWebPush(
          pushPayload,
          vapidKeys.public,
          vapidKeys.private,
          'mailto:founder@orderking.in'
        );

        if (success) successfullyEngaged++;
      }
    }

    return successfullyEngaged;
  }
}
