import { getSql } from '../../db';

export async function processPayment(orderId: string, amountPaise: number, paymentMethod: string, gateway: 'razorpay' | 'stripe') {
    if (!Number.isInteger(amountPaise)) {
        throw new Error('Amount must be an integer in paise');
    }

    let responseData: any;
    let transactionId = '';

    if (gateway === 'razorpay') {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!keyId || !keySecret) {
            throw new Error('Financial Security: Live payment gateways are pending legal/provider authorization. Razorpay credentials missing.');
        }

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
                'Authorization': `Basic ${btoa(`${keyId}:${keySecret}`)}`
            },
            body: JSON.stringify(payload)
        });
        responseData = await res.json();
        transactionId = responseData.id || `fallback_rzp_${Date.now()}`;
    } else if (gateway === 'stripe') {
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
            throw new Error('Financial Security: Live payment gateways are pending legal/provider authorization. Stripe credentials missing.');
        }

        const payload = new URLSearchParams({
            amount: amountPaise.toString(),
            currency: 'inr',
            'metadata[order_id]': orderId
        });
        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${stripeSecret}`
            },
            body: payload
        });
        responseData = await res.json();
        transactionId = responseData.id || `fallback_str_${Date.now()}`;
    }

    const sql = await getSql();

    await sql.transaction(async (tx) => {
        // Record the raw gateway transaction
        await tx`
            INSERT INTO transactions (id, order_id, amount, gateway, status)
            VALUES (${transactionId}, ${orderId}, ${amountPaise}, ${gateway}, 'SUCCESS')
        `;

        // Retrieve customer associated with order to log kingpay transaction
        const [order] = await tx`
            SELECT customer_id FROM orders WHERE id = ${orderId} LIMIT 1
        `;

        if (order?.customer_id) {
            await tx`
                INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
                VALUES (
                    ${'kp_tx_' + Date.now() + Math.random().toString(36).substring(2, 9)},
                    ${order.customer_id},
                    ${amountPaise},
                    'CREDIT',
                    'KingPay Payment Processing'
                )
            `;
        }
    });

    return responseData;
}
