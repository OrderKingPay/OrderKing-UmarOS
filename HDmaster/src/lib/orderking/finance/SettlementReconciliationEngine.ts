/**
 * SettlementReconciliationEngine
 * Handles precise financial logic for Taxes (GST), deductions, platform fees, and Partner Payouts.
 * Amounts are represented in the smallest currency unit (e.g., cents) using BigInt to avoid floating point errors.
 */

export interface OrderFinancials {
    orderId: string;
    subtotal: bigint;       // e.g. in cents
    taxRateBps: bigint;     // Basis points (1/100th of a percent, e.g. 500 = 5%)
    platformFeeBps: bigint; // Basis points
    deductions: bigint;     // Fixed deductions in cents
}

export interface SettlementResult {
    orderId: string;
    subtotal: bigint;
    taxAmount: bigint;
    platformFee: bigint;
    deductions: bigint;
    partnerPayout: bigint;
}

export class SettlementReconciliationEngine {
    /**
     * Calculates the settlement details for a given order.
     * Uses BigInt for zero fake money and precise arithmetic.
     * @param order The financials of the order
     */
    public calculateSettlement(order: OrderFinancials): SettlementResult {
        // Calculate Tax (e.g., GST)
        // formula: subtotal * taxRateBps / 10000
        const taxAmount = (order.subtotal * order.taxRateBps) / 10000n;

        // Calculate Platform Fee
        // formula: subtotal * platformFeeBps / 10000
        const platformFee = (order.subtotal * order.platformFeeBps) / 10000n;

        // Partner Payout = Subtotal + Tax - Platform Fee - Deductions
        const partnerPayout = order.subtotal + taxAmount - platformFee - order.deductions;

        if (partnerPayout < 0n) {
            throw new Error(`Negative payout calculated for order ${order.orderId}. Payout: ${partnerPayout}`);
        }

        return {
            orderId: order.orderId,
            subtotal: order.subtotal,
            taxAmount,
            platformFee,
            deductions: order.deductions,
            partnerPayout
        };
    }
}
