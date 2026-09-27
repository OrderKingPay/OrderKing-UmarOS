// Provider-backed revenue gateway facade.
// This module never invents settled transactions, balances, UTRs, or payment verification.
// Real payment truth must come from signed provider events / the canonical ledger.

import crypto from "node:crypto";

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

export class RevenueGatewayService {
  private transactions: PaymentTransaction[] = [];

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  getMetrics(): RevenueMetrics {
    const confirmed = this.transactions.filter((t) => t.status === "CONFIRMED");
    return {
      totalGrossInr: confirmed.reduce((acc, t) => acc + t.amountInr, 0),
      netFounderDepositedInr: confirmed.reduce((acc, t) => acc + t.netFounderDepositInr, 0),
      totalSavedGatewayFeesInr: 0,
      confirmedTransactionsCount: confirmed.length,
      pendingInvoicesCount: this.transactions.filter((t) => t.status === "PENDING").length,
      pendingInvoicesValueInr: this.transactions
        .filter((t) => t.status === "PENDING")
        .reduce((acc, t) => acc + t.amountInr, 0),
    };
  }

  createUpiPaymentLink(params: {
    amountInr: number;
    clientName: string;
    description: string;
    founderVpa?: string;
  }): { upiLink: string; qrPayload: string; transactionId: string } {
    if (!Number.isFinite(params.amountInr) || params.amountInr <= 0) {
      throw new Error("UPI amount must be greater than zero.");
    }

    const vpa = params.founderVpa?.trim() || process.env.ORDERKING_FOUNDER_VPA?.trim();
    if (!vpa) throw new Error("ORDERKING_FOUNDER_VPA is not configured; UPI link creation is blocked.");

    const txnId = `TXN-${crypto.randomUUID()}`;
    const upiLink = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent("OrderKing")}&am=${encodeURIComponent(params.amountInr.toFixed(2))}&cu=INR&tn=${encodeURIComponent(params.description)}`;

    this.transactions.unshift({
      id: txnId,
      amountInr: params.amountInr,
      channel: "KING_PAY_UPI",
      status: "PENDING",
      clientName: params.clientName,
      description: params.description,
      referenceNumber: `PENDING-${txnId}`,
      providerFeeInr: 0,
      netFounderDepositInr: 0,
      createdAt: new Date().toISOString(),
    });

    return {
      upiLink,
      qrPayload: `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent("OrderKing")}&am=${encodeURIComponent(params.amountInr.toFixed(2))}&cu=INR&tn=${encodeURIComponent(params.description)}`,
      transactionId: txnId,
    };
  }

  confirmUpiDeposit(_params: {
    transactionId: string;
    utrNumber: string;
    verifiedAmountInr: number;
  }): { success: boolean; transaction: PaymentTransaction } {
    throw new Error("Provider verification required. UPI deposits cannot be confirmed by client-entered UTR alone.");
  }

  verifyRazorpayWebhook(payload: string, signature: string, webhookSecret?: string): boolean {
    if (!payload || !signature || !webhookSecret) return false;
    const expected = crypto.createHmac("sha256", webhookSecret).update(payload, "utf8").digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  verifyStripeWebhook(payload: string, signature: string, webhookSecret?: string, toleranceSeconds = 300): boolean {
    if (!payload || !signature || !webhookSecret) return false;
    const parts = signature.split(",").map((p) => p.trim());
    const timestamp = Number(parts.find((p) => p.startsWith("t="))?.slice(2));
    const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
    if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > toleranceSeconds) return false;

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${payload}`, "utf8")
      .digest("hex");

    return signatures.some((value) => {
      try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(value));
      } catch {
        return false;
      }
    });
  }
}

export const revenueGateway = new RevenueGatewayService();
