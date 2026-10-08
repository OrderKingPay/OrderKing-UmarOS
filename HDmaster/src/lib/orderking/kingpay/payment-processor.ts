import { getSql } from '../../db';

export async function processPayment(orderId: string, amountPaise: number, paymentMethod: string, gateway: 'razorpay' | 'stripe') {
    if (!Number.isInteger(amountPaise)) {
        throw new Error('Amount must be an integer in paise');
    }

    let responseData: any;
    let transactionId = '';

    if (gateway === 'razorpay') {
        const payload = {
            amount: amountPaise,
            currency: 'INR',
            receipt: `order_rcptid_${orderId}`,
            method: paymentMethod
        };
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa('YOUR_RAZORPAY_KEY:YOUR_RAZORPAY_SECRET')}`
            },
            body: JSON.stringify(payload)
        });
        responseData = await res.json();
        transactionId = responseData.id;
    } else if (gateway === 'stripe') {
        const payload = new URLSearchParams({
            amount: amountPaise.toString(),
            currency: 'inr',
            'metadata[order_id]': orderId
        });
        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer YOUR_STRIPE_SECRET_KEY`
            },
            body: payload
        });
        responseData = await res.json();
        transactionId = responseData.id;
    }

    const sql = await getSql();
    await sql`
        INSERT INTO transactions (id, order_id, amount, gateway, status)
        VALUES (${transactionId}, ${orderId}, ${amountPaise}, ${gateway}, 'SUCCESS')
    `;

    return responseData;
}
