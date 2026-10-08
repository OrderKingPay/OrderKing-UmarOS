import { NextRequest, NextResponse } from 'next/server';
import { processPayment } from '../../../../lib/orderking/kingpay/payment-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, provider } = body;
    
    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const gateway = provider === 'razorpay' ? 'razorpay' : 'stripe';
    
    const session = await processPayment(
      orderId,
      amount,
      'card',
      gateway
    );

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
