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
        const payload = {
            amount: amount,
            speed: 'normal',
            notes: { reason: reasonCode }
        };
        const res = await fetch(`https://api.razorpay.com/v1/payments/${transactionId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa('YOUR_RAZORPAY_KEY:YOUR_RAZORPAY_SECRET')}`
            },
            body: JSON.stringify(payload)
        });
        responseData = await res.json();
    } else if (gateway === 'stripe') {
        const payload = new URLSearchParams({
            payment_intent: transactionId,
            reason: reasonCode
        });
        const res = await fetch('https://api.stripe.com/v1/refunds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer YOUR_STRIPE_SECRET_KEY`
            },
            body: payload
        });
        responseData = await res.json();
    }

    await sql`
        UPDATE transactions
        SET status = 'REFUNDED'
        WHERE id = ${transactionId}
    `;

    return responseData;
}
