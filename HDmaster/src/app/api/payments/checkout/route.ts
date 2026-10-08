// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentSession } from '../../../lib/orderking/payment-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency, provider } = body;
    
    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await createPaymentSession({
      orderId,
      amount,
      currency: currency || 'USD',
      provider: provider || 'stripe'
    });

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
