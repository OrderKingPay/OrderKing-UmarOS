import { getSql } from '../../db';

export class InvalidTransitionError extends Error {
  constructor(fromStatus: string, toStatus: string) {
    super(`Invalid order status transition from ${fromStatus} to ${toStatus}`);
    this.name = 'InvalidTransitionError';
  }
}

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  RIDER_ASSIGNED: 'RIDER_ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  ON_THE_WAY: 'ON_THE_WAY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RESTAURANT_REJECTED: 'RESTAURANT_REJECTED',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

const VALID_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
    OrderStatus.RESTAURANT_REJECTED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY]: [
    OrderStatus.RIDER_ASSIGNED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.RIDER_ASSIGNED]: [
    OrderStatus.PICKED_UP,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PICKED_UP]: [
    OrderStatus.ON_THE_WAY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ON_THE_WAY]: [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RESTAURANT_REJECTED]: [],
};

export async function transitionOrder(
  orderId: string,
  fromStatus: string,
  toStatus: string,
  actorId: string,
  reason?: string
): Promise<void> {
  const allowedTransitions = VALID_TRANSITIONS[fromStatus];
  if (!allowedTransitions || !allowedTransitions.includes(toStatus)) {
    throw new InvalidTransitionError(fromStatus, toStatus);
  }

  const sql = await getSql();

  await sql.transaction(async (tx) => {
    const updateResult = await tx<{ id: string }>`
      UPDATE orders
      SET status = ${toStatus},
          updated_at = NOW()
      WHERE id = ${orderId}
        AND status = ${fromStatus}
      RETURNING id
    `;

    if (updateResult.length === 0) {
      throw new Error(`Order ${orderId} is not in status ${fromStatus} or does not exist`);
    }

    await tx`
      INSERT INTO order_status_history (
        order_id,
        previous_status,
        new_status,
        actor_id,
        reason
      ) VALUES (
        ${orderId},
        ${fromStatus},
        ${toStatus},
        ${actorId},
        ${reason ?? null}
      )
    `;
  });
}
