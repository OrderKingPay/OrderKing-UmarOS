import { getSql } from '../../db';
import { notifyOrderUpdate } from './notification-dispatcher';

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  EN_ROUTE = 'EN_ROUTE',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_REQUESTED = 'REFUND_REQUESTED'
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.EN_ROUTE],
  [OrderStatus.EN_ROUTE]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUND_REQUESTED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUND_REQUESTED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
};

export async function transitionOrder(orderId: string, newStatus: OrderStatus): Promise<void> {
  const sql = await getSql();
  
  const currentRows = await sql`SELECT status FROM orders WHERE id = ${orderId}`;
  if (currentRows.length === 0) {
    throw new Error(`Order ${orderId} not found`);
  }
  
  const currentStatus = (currentRows[0] as any).status as OrderStatus;
  
  if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }
  
  await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ${orderId}`;
  await sql`INSERT INTO order_status_logs (order_id, previous_status, new_status, created_at) VALUES (${orderId}, ${currentStatus}, ${newStatus}, NOW())`;
  
  await notifyOrderUpdate(orderId, newStatus);
}
