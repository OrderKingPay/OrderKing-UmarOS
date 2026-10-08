/**
 * Reconciliation Engine
 */

export async function reconcileWebhooks(webhookEvent: any, updateDatabaseStatus: (batchId: string, status: string) => Promise<void>): Promise<void> {
    // Handling Stripe Webhooks
    if (webhookEvent.type === 'transfer.created' || webhookEvent.type === 'transfer.updated') {
        const transfer = webhookEvent.data.object;
        const batchId = transfer.metadata?.batchId || transfer.notes?.batchId;
        
        if (batchId) {
            await updateDatabaseStatus(batchId, 'SETTLED');
        }
    }

    // Handling Razorpay Webhooks
    if (webhookEvent.event === 'transfer.processed') {
        const transfer = webhookEvent.payload.transfer.entity;
        const batchId = transfer.notes?.batchId;

        if (batchId) {
            await updateDatabaseStatus(batchId, 'SETTLED');
        }
    }
}
