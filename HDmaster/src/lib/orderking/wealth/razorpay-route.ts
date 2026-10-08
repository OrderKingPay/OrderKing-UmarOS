/**
 * Razorpay Route Settlement
 */

export interface RazorpayTransferData {
    account: string;
    amount: number;
    currency: string;
    notes?: Record<string, string>;
    linked_account_notes?: string[];
    on_hold?: boolean;
}

export async function createTransfer(transferData: RazorpayTransferData, razorpayKeyId: string, razorpayKeySecret: string): Promise<any> {
    const response = await fetch('https://api.razorpay.com/v1/transfers', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            transfers: [
                transferData
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`Razorpay transfer failed: ${await response.text()}`);
    }

    return response.json();
}
