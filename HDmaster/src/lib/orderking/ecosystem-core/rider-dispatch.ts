import { getSql } from '../../db';

export async function assignOrderToNearestRider(orderId: string, orderLat: number, orderLng: number) {
  const sql = await getSql();
  
  // Geospatial math in SQL (Haversine formula approximation)
  const closestRiders = await sql`
    SELECT id, name, lat, lng, status,
      (6371 * acos(
        cos(radians(${orderLat})) * cos(radians(lat)) * 
        cos(radians(lng) - radians(${orderLng})) + 
        sin(radians(${orderLat})) * sin(radians(lat))
      )) AS distance
    FROM riders
    WHERE status = 'ACTIVE'
    ORDER BY distance ASC
    LIMIT 3
  `;

  if (closestRiders.length === 0) {
    throw new Error('No active riders found nearby.');
  }

  const nearestRider = closestRiders[0];

  // Assign order to the nearest rider
  await sql`
    UPDATE orders
    SET rider_id = ${nearestRider.id}, status = 'ASSIGNED'
    WHERE id = ${orderId}
  `;

  return nearestRider;
}
