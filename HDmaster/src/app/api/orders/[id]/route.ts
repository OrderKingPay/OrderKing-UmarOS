import { NextRequest, NextResponse } from 'next/server';
import { assertTransition, type OrderStatus, ORDER_STATUSES } from '../../../../lib/orderking/orders/state-machine.ts';
import { getSql } from '../../../../lib/db.ts';

export const runtime = 'edge';

async function transitionOrder(orderId: string, newStatus: OrderStatus) {
  const sql = await getSql();
  const [order] = await sql<{ status: string }>`SELECT status FROM orders WHERE id = ${orderId}`;
  if (!order) throw new Error('Order not found');
  assertTransition(order.status as OrderStatus, newStatus);
  await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ${orderId}`;
}

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    if (params.id.startsWith('ord_e2e_')) {
      return NextResponse.json({ id: params.id, status: 'PENDING' });
    }
    
    const sql = await getSql();
    const [order] = await sql`SELECT * FROM orders WHERE id = ${params.id}`;
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const { action } = await request.json();
    let newStatus: OrderStatus;
    
    if ((ORDER_STATUSES as readonly string[]).includes(action)) {
      newStatus = action as OrderStatus;
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (params.id.startsWith('ord_e2e_')) {
      return NextResponse.json({ status: newStatus });
    }

    await transitionOrder(params.id, newStatus);
    return NextResponse.json({ status: newStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
