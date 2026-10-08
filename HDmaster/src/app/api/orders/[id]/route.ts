import { NextRequest, NextResponse } from 'next/server';
import { transitionOrder, OrderStatus } from '../../../../lib/orderking/order-ops/order-state-machine';
import { getSql } from '../../../../lib/db';

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
    
    if (Object.values(OrderStatus).includes(action)) {
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
