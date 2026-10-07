export type OrderState =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CAPTURED'
  | 'PENDING_RESTAURANT_ACCEPTANCE'
  | 'RESTAURANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'RIDER_AT_RESTAURANT'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'RIDER_AT_CUSTOMER'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'SETTLED';

export interface OrderStateTransition {
  orderId: string;
  from: OrderState;
  to: OrderState;
  actorType: 'SYSTEM' | 'CUSTOMER' | 'RESTAURANT' | 'RIDER' | 'ADMIN' | 'AI_AGENT';
  actorId: string;
  reason?: string;
  timestamp: string;
}

export class OrderStateMachine {
  private sql: any;

  constructor(sqlContext: any) {
    this.sql = sqlContext;
  }

  async transition(transition: OrderStateTransition): Promise<{ success: boolean; error?: string }> {
    const { orderId, from, to, actorType, actorId, reason } = transition;

    // Verify current state
    const [order] = await this.sql`SELECT status FROM orders WHERE id = ${orderId}`;
    if (!order) return { success: false, error: 'Order not found' };
    
    // We relax strict `from` check for admin overrides, but generally enforce it
    if (actorType !== 'ADMIN' && order.status !== from) {
      return { success: false, error: `Invalid transition. Order is in ${order.status}, expected ${from}.` };
    }

    // Atomic update
    const result = await this.sql`
      UPDATE orders 
      SET status = ${to}, updated_at = NOW() 
      WHERE id = ${orderId}
      RETURNING id
    `;

    if (!result || result.length === 0) {
      return { success: false, error: 'Failed to update order state' };
    }

    // Audit Log
    await this.sql`
      INSERT INTO audit_logs (entity_type, entity_id, action, actor_type, actor_id, details)
      VALUES ('ORDER', ${orderId}, ${`TRANSITION_${from}_TO_${to}`}, ${actorType}, ${actorId}, ${JSON.stringify({ reason })})
    `;

    return { success: true };
  }
}
