import { NextRequest, NextResponse } from 'next/server';
import { transitionOrder, OrderStatus } from '../../../../lib/orderking/order-ops/order-state-machine';
import { getSql } from '../../../../lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = await getSql();
    const [order] = await sql`SELECT * FROM orders WHERE id = ${params.id}`;
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action } = await request.json();
    let newStatus: OrderStatus;
    
    // Map string action to enum if needed, or just cast
    if (Object.values(OrderStatus).includes(action)) {
      newStatus = action as OrderStatus;
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await transitionOrder(params.id, newStatus);
    return NextResponse.json({ status: newStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
