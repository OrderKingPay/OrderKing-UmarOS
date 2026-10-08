import { getSql } from '../../db';

export async function submitRating(orderId: string, ratedBy: 'customer' | 'rider', rating: number, review?: string): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const sql = await getSql();
  
  const orderRows = await sql`SELECT restaurant_id, rider_id, customer_id FROM orders WHERE id = ${orderId}`;
  if (orderRows.length === 0) {
    throw new Error(`Order ${orderId} not found`);
  }
  
  const order = orderRows[0] as any;
  let targetId: string;
  let targetType: 'restaurant' | 'customer';
  let raterId: string;
  
  if (ratedBy === 'customer') {
    targetId = order.restaurant_id;
    targetType = 'restaurant';
    raterId = order.customer_id;
  } else {
    targetId = order.customer_id;
    targetType = 'customer';
    raterId = order.rider_id;
  }
  
  await sql`
    INSERT INTO ratings (order_id, target_id, target_type, rater_id, rating, review, created_at)
    VALUES (${orderId}, ${targetId}, ${targetType}, ${raterId}, ${rating}, ${review || null}, NOW())
  `;
  
  if (targetType === 'restaurant') {
    await sql`
      UPDATE restaurants r
      SET 
        rating_average = (SELECT AVG(rating) FROM ratings WHERE target_id = r.id AND target_type = 'restaurant'),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE target_id = r.id AND target_type = 'restaurant')
      WHERE r.id = ${targetId}
    `;
  } else if (targetType === 'customer') {
    await sql`
      UPDATE users u
      SET 
        rating_average = (SELECT AVG(rating) FROM ratings WHERE target_id = u.id AND target_type = 'customer'),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE target_id = u.id AND target_type = 'customer')
      WHERE u.id = ${targetId}
    `;
  }
}
