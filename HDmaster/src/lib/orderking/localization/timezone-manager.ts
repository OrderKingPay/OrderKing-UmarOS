import { getSql } from '../../db';

export async function isRestaurantOpen(restaurantId: string, userTimezone: string): Promise<boolean> {
  const sql = await getSql();
  
  const rows = await sql`
    SELECT open_time, close_time, timezone 
    FROM restaurant_hours 
    WHERE restaurant_id = ${restaurantId}
  `;

  if (!rows || rows.length === 0) {
    return false;
  }

  const { open_time, close_time, timezone: restaurantTimezone } = rows[0] as any;

  const now = new Date();
  
  // Format current time in restaurant's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: restaurantTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const currentRestTime = formatter.format(now);

  // We could also convert open_time and close_time to the userTimezone 
  // to display it to the user, but for checking if it's open, 
  // we just compare current time in restaurant's timezone.
  
  // Just to use the userTimezone parameter as an example:
  const userFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const currentUserTime = userFormatter.format(now);
  console.log(`Checking restaurant open status. User time: ${currentUserTime}, Restaurant time: ${currentRestTime}`);

  return currentRestTime >= open_time && currentRestTime <= close_time;
}
