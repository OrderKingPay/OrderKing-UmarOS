import { z } from "zod";

// 1. Strict Order State Enum
export const OrderStatusEnum = z.enum([
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "delivered",
  "cancelled"
]);

export type OrderStatus = z.infer<typeof OrderStatusEnum>;

// 2. State Transition Validator
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["delivered", "cancelled"],
  delivered: [], // Terminal state
  cancelled: []  // Terminal state
};

export function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}

// 3. Schema for Assigning a Rider
export const AssignRiderSchema = z.object({
  orderId: z.string(),
  riderId: z.string(),
  currentStatus: z.literal("ready")
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string(),
  currentStatus: OrderStatusEnum,
  nextStatus: OrderStatusEnum
}).refine(data => canTransition(data.currentStatus, data.nextStatus), {
  message: "Invalid state transition"
});

// 4. Concurrency Safe Database Transaction Logic (TypeScript Layer)
export async function assignRiderTransactionally(sql: any, orderId: string, riderId: string) {
  // Using atomic update to prevent race conditions (two riders accepting the same order simultaneously)
  const result = await sql.query(
    `UPDATE orders 
     SET rider_id = $1, status = 'assigned' 
     WHERE id = $2 AND status = 'ready' AND rider_id IS NULL 
     RETURNING id`,
    [riderId, orderId]
  );
  
  if (result.length === 0) {
    throw new Error("Concurrency Conflict: Order was already accepted by another rider or is no longer ready.");
  }
  
  return result[0];
}
