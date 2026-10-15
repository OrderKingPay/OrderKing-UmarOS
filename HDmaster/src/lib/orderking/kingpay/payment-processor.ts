import { getSql } from '../../db';

export async function processPayment(orderId: string, amountPaise: number, paymentMethod: string, gateway: 'razorpay' | 'stripe') {
    if (!Number.isInteger(amountPaise)) {
        throw new Error('Amount must be an integer in paise');
    }

    let responseData: any;
    let transactionId = '';

    if (gateway === 'razorpay') {
        const keyId = process.env.RAZORPAY_KEY_ID?.trim();
        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
        
        if (!keyId || !keySecret) {
            throw new Error('Financial Security: Live payment gateways are pending legal/provider authorization. Razorpay credentials missing.');
        }

        if (!keyId.startsWith("rzp_test_") && !keyId.startsWith("rzp_live_")) {
            throw new Error('Strict enforcement: RAZORPAY_KEY_ID must be a valid key starting with rzp_test_ or rzp_live_');
        }

        const payload = {
            amount: amountPaise,
            currency: 'INR',
            receipt: `order_rcptid_${orderId}`,
            method: paymentMethod
        };
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`
            },
            body: JSON.stringify(payload)
        });
        responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
            const description = responseData?.error?.description || `Razorpay order creation failed (${res.status})`;
            throw new Error(`Razorpay gateway error: ${description}`);
        }
        if (!responseData?.id) {
            throw new Error('Razorpay gateway returned an invalid order response without an ID');
        }
        transactionId = responseData.id;
    } else if (gateway === 'stripe') {
        const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
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
        responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
            const description = responseData?.error?.message || `Stripe payment intent creation failed (${res.status})`;
            throw new Error(`Stripe gateway error: ${description}`);
        }
        if (!responseData?.id) {
            throw new Error('Stripe gateway returned an invalid payment intent response without an ID');
        }
        transactionId = responseData.id;
    }

    const sql = await getSql();

    await sql.transaction(async (tx) => {
        // Ensure transactions ledger table exists
        await tx`
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                order_id TEXT NOT NULL,
                amount BIGINT NOT NULL,
                gateway TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `;

        // Record the genuine gateway transaction in PENDING state awaiting provider webhook verification
        await tx`
            INSERT INTO transactions (id, order_id, amount, gateway, status, updated_at)
            VALUES (${transactionId}, ${orderId}, ${amountPaise}, ${gateway}, 'PENDING', NOW())
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
        `;
    });

    return responseData;
}
