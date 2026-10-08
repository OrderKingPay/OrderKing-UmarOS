import { eventBus } from '../events/EventBus.js';
import cron from 'node-cron';
import { getSql } from '../../db.js';

export interface OrderPattern {
  userId: string;
  item: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number;
  minute: number;
}

export class PredictivePushWorker {
  // Track known patterns in memory or DB
  private activePatterns: Map<string, OrderPattern[]> = new Map();

  constructor() {
    this.initializeWorker();
    this.listenToNewOrders();
  }

  private initializeWorker() {
    // Run evaluation every hour to find new patterns
    cron.schedule('0 * * * *', () => {
      this.evaluateOrderHistories();
    });

    // Run every minute to check if a push notification needs to be sent
    cron.schedule('* * * * *', () => {
      this.triggerScheduledPushes();
    });
    
    console.log('[PredictivePushWorker] Initialized background worker for hyper-personalized notifications');
  }

  private listenToNewOrders() {
    // Connect to the EventBus to track user order history in real-time
    eventBus.subscribe('order.placed', async (payload: any) => {
      const { userId, items, timestamp } = payload;
      
      // We log or insert the order history in the DB here
      try {
        const sql = await getSql();
        for (const item of items) {
          // Track the item ordered
          await sql`
            INSERT INTO order_history_tracking (user_id, item_name, ordered_at) 
            VALUES (${userId}, ${item.name}, ${new Date(timestamp)})
          `;
        }
      } catch (error) {
        console.error('[PredictivePushWorker] Error tracking order history:', error);
      }
    });
  }

  private async evaluateOrderHistories() {
    console.log('[PredictivePushWorker] Evaluating user order histories for predictive patterns...');
    try {
      const sql = await getSql();
      // Query the DB to find recurring patterns 
      // Specifically looking for Biryani ordered on Fridays around 1 PM (13:00)
      const recurringOrders = await sql`
        SELECT user_id
        FROM order_history_tracking
        WHERE item_name ILIKE '%Biryani%'
          AND EXTRACT(DOW FROM ordered_at) = 5 -- Friday
          AND EXTRACT(HOUR FROM ordered_at) = 13 -- 1 PM
        GROUP BY user_id
        HAVING COUNT(*) >= 2 -- At least 2 times implies a pattern
      `;

      for (const row of recurringOrders) {
        const detectedPattern: OrderPattern = {
          userId: String(row.user_id),
          item: 'Biryani',
          dayOfWeek: 5, // Friday
          hour: 13,
          minute: 0
        };
        
        const existing = this.activePatterns.get(detectedPattern.userId) || [];
        if (!existing.some(p => p.item === 'Biryani' && p.dayOfWeek === 5 && p.hour === 13)) {
            existing.push(detectedPattern);
            this.activePatterns.set(detectedPattern.userId, existing);
        }
      }
    } catch (error) {
      console.error('[PredictivePushWorker] Failed to evaluate order histories:', error);
    }
  }

  private triggerScheduledPushes() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Iterate through active patterns
    this.activePatterns.forEach((patterns, userId) => {
      for (const pattern of patterns) {
        // Calculate the trigger time (15 mins before the usual order time)
        let triggerHour = pattern.hour;
        let triggerMinute = pattern.minute - 15;
        
        if (triggerMinute < 0) {
          triggerMinute += 60;
          triggerHour -= 1;
        }

        // If today matches the pattern day and the time matches the 15m advance window
        if (
          pattern.dayOfWeek === currentDay &&
          triggerHour === currentHour &&
          triggerMinute === currentMinute
        ) {
          console.log(`[PredictivePushWorker] Autonomously triggering push notification for ${userId}`);
          
          eventBus.publish('notification.push.send', {
            userId: pattern.userId,
            title: `Time for your ${pattern.item}!`,
            body: `You usually order ${pattern.item} around this time. Tap here to reorder instantly!`,
            type: 'predictive_reorder'
          });
        }
      }
    });
  }
}

export const predictivePushWorker = new PredictivePushWorker();
