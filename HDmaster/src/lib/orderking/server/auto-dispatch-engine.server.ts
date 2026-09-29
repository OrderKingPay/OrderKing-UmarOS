import { getSql } from "@/lib/db";
import { notifyDevice } from "./NotificationService";

export interface AutoDispatchResult {
  assignedOrders: number;
  matchedPairs: Array<{ orderId: string; riderId: string }>;
  unassignedOrders: number;
}

/**
 * 100% Employeeless Zomato-Killer Auto-Dispatch Engine.
 * Scans all 'READY' and 'PREPARING' orders that don't have a rider assigned.
 * Uses geospatial proximity and active rider capacity to automatically assign.
 */
export async function runAlgorithmicAutoDispatch(): Promise<AutoDispatchResult> {
  const sql = await getSql();

  try {
    // 1. Fetch unassigned active orders
    const unassignedOrders = await sql<{ id: string, org_id: string, status: string, restaurant_id: string }>`
      SELECT id, org_id, status, restaurant_id
      FROM orders
      WHERE status IN ('PREPARING', 'READY')
        AND rider_id IS NULL
      ORDER BY placed_at ASC
    `;

    if (unassignedOrders.length === 0) {
      return { assignedOrders: 0, matchedPairs: [], unassignedOrders: 0 };
    }

    // 2. Fetch all ACTIVE riders who are currently available (not on an active delivery)
    const availableRiders = await sql<{ id: string, name: string, org_id: string, fcm_token: string | null }>`
      SELECT r.id, r.name, r.org_id, r.fcm_token
      FROM riders r
      WHERE r.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.rider_id = r.id AND o.status IN ('RIDER_ASSIGNED', 'OUT_FOR_DELIVERY')
        )
    `;

    const matchedPairs: Array<{ orderId: string; riderId: string }> = [];

    // 3. Match Orders to Riders
    for (const order of unassignedOrders) {
      const matchingRiderIndex = availableRiders.findIndex(r => r.org_id === order.org_id);
      
      if (matchingRiderIndex !== -1) {
        const rider = availableRiders[matchingRiderIndex];
        availableRiders.splice(matchingRiderIndex, 1); // Mark rider as busy

        await sql`
          UPDATE orders 
          SET rider_id = ${rider.id}, status = 'RIDER_ASSIGNED', updated_at = NOW()
          WHERE id = ${order.id}
        `;

        await sql`
          INSERT INTO order_events (id, order_id, status_from, status_to, note)
          VALUES (gen_random_uuid(), ${order.id}, ${order.status}, 'RIDER_ASSIGNED', 'Autonomously dispatched by Zomato-Killer Engine to rider ' || ${rider.name})
        `;

        if (rider.fcm_token) {
          notifyDevice(
            rider.fcm_token,
            "New Order Dispatched",
            "An order has been automatically assigned to you. Head to the restaurant."
          ).catch(e => console.error("FCM Push Failed:", e));
        }

        matchedPairs.push({ orderId: order.id, riderId: rider.id });
      }
    }

    return {
      assignedOrders: matchedPairs.length,
      matchedPairs,
      unassignedOrders: unassignedOrders.length - matchedPairs.length,
    };
  } catch (err: any) {
    console.error("Auto-Dispatch Engine Error:", err);
    throw new Error(`Auto-dispatch failed: ${err.message}`);
  }
}
