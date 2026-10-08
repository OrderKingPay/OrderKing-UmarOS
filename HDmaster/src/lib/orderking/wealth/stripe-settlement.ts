/**
 * Stripe Connect Settlement
 */

export async function createTransfer(destinationAccountId: string, amountPaise: number, currency: string = 'usd', stripeSecretKey: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('amount', amountPaise.toString());
    params.append('currency', currency);
    params.append('destination', destinationAccountId);

    const response = await fetch('https://api.stripe.com/v1/transfers', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    if (!response.ok) {
        throw new Error(`Stripe transfer failed: ${await response.text()}`);
    }

    return response.json();
}
