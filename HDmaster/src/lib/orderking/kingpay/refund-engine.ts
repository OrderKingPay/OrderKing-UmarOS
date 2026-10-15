import { getSql } from '../../db';

export async function requestRefund(transactionId: string, reasonCode: string) {
    const sql = await getSql();
    const rows = await sql`SELECT gateway, amount FROM transactions WHERE id = ${transactionId}`;
    if (rows.length === 0) {
        throw new Error('Transaction not found');
    }
    const gateway = (rows[0] as any).gateway;
    const amount = (rows[0] as any).amount;

    let responseData: any;

    if (gateway === 'razorpay') {
        const keyId = process.env.RAZORPAY_KEY_ID?.trim();
        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
        if (!keyId || !keySecret) {
            throw new Error('Financial Security: Razorpay credentials missing for refund.');
        }

        const payload = {
            amount: amount,
            speed: 'normal',
            notes: { reason: reasonCode }
        };
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const res = await fetch(`https://api.razorpay.com/v1/payments/${transactionId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(payload)
        });
        responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
            const description = responseData?.error?.description || `Razorpay refund failed (${res.status})`;
            throw new Error(`Razorpay gateway error: ${description}`);
        }
    } else if (gateway === 'stripe') {
        const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
        if (!stripeSecret) {
            throw new Error('Financial Security: Stripe secret key missing for refund.');
        }

        const payload = new URLSearchParams({
            payment_intent: transactionId,
            reason: reasonCode
        });
        const res = await fetch('https://api.stripe.com/v1/refunds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${stripeSecret}`
            },
            body: payload
        });
        responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
            const message = responseData?.error?.message || `Stripe refund failed (${res.status})`;
            throw new Error(`Stripe gateway error: ${message}`);
        }
    }

    await sql`
        UPDATE transactions
        SET status = 'REFUNDED', updated_at = NOW()
        WHERE id = ${transactionId}
    `;

    return responseData;
}
