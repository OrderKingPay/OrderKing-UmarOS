// Explicit provider boundary for finance/revenue features.
//
// This module deliberately contains NO seeded financial transactions and NO
// synthetic confirmation paths. Until a real provider is configured and its
// webhook/reconciliation contract is verified, revenue operations fail closed.

import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentChannel = "KING_PAY_UPI" | "RAZORPAY" | "STRIPE";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";

export interface PaymentTransaction {
  id: string;
  amountInr: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  clientName: string;
  description: string;
  referenceNumber: string;
  providerFeeInr: number;
  netFounderDepositInr: number;
  createdAt: string;
  settledAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RevenueMetrics {
  totalGrossInr: number;
  netFounderDepositedInr: number;
  totalSavedGatewayFeesInr: number;
  confirmedTransactionsCount: number;
  pendingInvoicesCount: number;
  pendingInvoicesValueInr: number;
}

function unavailable(operation: string): never {
  throw new Error(`${operation} is unavailable until a real payment provider, contract, credentials, webhook verification, and reconciliation flow are configured.`);
}

export class RevenueGatewayService {
  private transactions: PaymentTransaction[] = [];

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  getMetrics(): RevenueMetrics {
    return {
      totalGrossInr: 0,
      netFounderDepositedInr: 0,
      totalSavedGatewayFeesInr: 0,
      confirmedTransactionsCount: 0,
      pendingInvoicesCount: 0,
      pendingInvoicesValueInr: 0,
    };
  }

  createUpiPaymentLink(_params: {
    amountInr: number;
    clientName: string;
    description: string;
    founderVpa?: string;
  }): { upiLink: string; qrPayload: string; transactionId: string } {
    return unavailable("Direct UPI payment links");
  }

  confirmUpiDeposit(_params: {
    transactionId: string;
    utrNumber: string;
    verifiedAmountInr: number;
  }): { success: boolean; transaction: PaymentTransaction } {
    return unavailable("Manual UPI confirmation");
  }

  verifyRazorpayWebhook(
    rawBody: string,
    signature: string,
    webhookSecret?: string,
  ): boolean {
    if (!rawBody || !signature || !webhookSecret) return false;
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const provided = signature.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(provided)) return false;
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(provided, "utf8"));
  }

  verifyStripeWebhook(
    _rawBody: string,
    _signature: string,
    _webhookSecret?: string,
  ): boolean {
    // Stripe signature verification must use Stripe's official event
    // construction with the exact raw request body. Do not accept a boolean
    // placeholder as proof of payment.
    return false;
  }
}

export const revenueGateway = new RevenueGatewayService();
