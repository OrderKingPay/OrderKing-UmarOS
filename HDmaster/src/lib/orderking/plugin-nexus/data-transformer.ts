export interface StandardOrder {
    id: string;
    totalAmount: number;
    currency: string;
    customer: {
        id: string;
        email: string;
    };
    lineItems: Array<{
        id: string;
        title: string;
        quantity: number;
        price: number;
    }>;
}

export function transformShopifyOrder(shopifyOrder: any): StandardOrder {
    return {
        id: shopifyOrder.id.toString(),
        totalAmount: parseFloat(shopifyOrder.total_price),
        currency: shopifyOrder.currency,
        customer: {
            id: shopifyOrder.customer?.id?.toString() || 'unknown',
            email: shopifyOrder.customer?.email || 'unknown@example.com'
        },
        lineItems: (shopifyOrder.line_items || []).map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            quantity: item.quantity,
            price: parseFloat(item.price)
        }))
    };
}

export function transformStripeEvent(stripeEvent: any): any {
    if (stripeEvent.type === 'payment_intent.succeeded') {
        const intent = stripeEvent.data.object;
        return {
            paymentId: intent.id,
            amount: intent.amount / 100,
            currency: intent.currency,
            status: 'succeeded'
        };
    }
    return null;
}
