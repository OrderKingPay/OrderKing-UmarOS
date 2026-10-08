import { getSql } from "@/lib/db";
import { nid } from "@/lib/orderking/server/workspace.server";

export async function processLoyaltyForOrder(
  tx: any,
  orgId: string,
  customerId: string,
  orderId: string,
  totalPaise: number
) {
  // 1 King Coin per 100 paise (i.e. 1 Rupee)
  const coinsEarned = Math.floor(totalPaise / 100);

  // Fetch current customer loyalty stats
  const customerRows = await tx`
    SELECT king_coins, current_streak, highest_streak, last_streak_at
    FROM customers
    WHERE id = ${customerId} AND org_id = ${orgId}
    FOR UPDATE
  `;
  if (!customerRows || customerRows.length === 0) return;
  const customer = customerRows[0];

  let newStreak = customer.current_streak;
  const now = new Date();
  
  if (!customer.last_streak_at) {
    newStreak = 1;
  } else {
    const lastStreak = new Date(customer.last_streak_at);
    const diffHours = (now.getTime() - lastStreak.getTime()) / (1000 * 60 * 60);
    
    if (diffHours > 48) {
      // Streak broken
      newStreak = 1;
    } else if (diffHours > 24) {
      // Continue streak
      newStreak += 1;
    }
    // If diffHours <= 24, streak doesn't increment but doesn't break
  }

  const highestStreak = Math.max(customer.highest_streak, newStreak);
  const newCoins = customer.king_coins + coinsEarned;

  // Update customer
  await tx`
    UPDATE customers 
    SET king_coins = ${newCoins}, 
        current_streak = ${newStreak}, 
        highest_streak = ${highestStreak}, 
        last_streak_at = ${now.toISOString()} 
    WHERE id = ${customerId} AND org_id = ${orgId}
  `;

  // Insert into ledger
  if (coinsEarned > 0) {
    const ledgerId = nid("kcl");
    await tx`
      INSERT INTO king_coins_ledger (id, org_id, customer_id, order_id, amount, balance_after, reason)
      VALUES (${ledgerId}, ${orgId}, ${customerId}, ${orderId}, ${coinsEarned}, ${newCoins}, 'order_earn')
    `;
  }
}
