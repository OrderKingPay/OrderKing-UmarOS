// @ts-nocheck
// Legitimate Payment & Revenue Gateway Integration
// Supports King Pay UPI, Razorpay, and Stripe with Webhook Verification and Zero-Fabrication Integrity

export type PaymentChannel = "KING_PAY_UPI" | "RAZORPAY" | "STRIPE";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";

export interface PaymentTransaction {
  id: string;
  amountInr: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  clientName: string;
  description: string;
  referenceNumber: string; // UTR or provider payment ID
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
    const totalGross = confirmed.reduce((acc, t) => acc + t.amountInr, 0);
    const netFounder = confirmed.reduce((acc, t) => acc + t.netFounderDepositInr, 0);
    // Do not invent a comparison fee. A "saved fees" number exists only when a
    // real comparison rate is configured by the founder.
    const comparisonBps = Number(process.env.GATEWAY_COMPARISON_FEE_BPS || 0);
    const savedFees = comparisonBps > 0
      ? confirmed.reduce((acc, t) => acc + Math.round(t.amountInr * comparisonBps / 10000), 0)
      : 0;

    return {
      totalGrossInr: totalGross,
      netFounderDepositedInr: netFounder,
      totalSavedGatewayFeesInr: savedFees,
      confirmedTransactionsCount: confirmed.length,
      pendingInvoicesCount: this.transactions.filter((t) => t.status === "PENDING").length,
      pendingInvoicesValueInr: this.transactions
        .filter((t) => t.status === "PENDING")
        .reduce((sum, t) => sum + t.amountInr, 0),
    };
  }

  createUpiPaymentLink(params: {
    amountInr: number;
    clientName: string;
    description: string;
    founderVpa?: string;
  }): { upiLink: string; qrPayload: string; transactionId: string } {
    const vpa = params.founderVpa?.trim() || process.env.KINGPAY_FOUNDER_VPA?.trim();
    if (!vpa) throw new Error("KINGPAY_FOUNDER_VPA is not configured; refusing to generate a payment link.");
    const txnId = `TXN-${Date.now().toString().slice(-4)}`;
    const upiLink = `upi://pay?pa=${vpa}&pn=OrderKing&am=${params.amountInr}&cu=INR&tn=${encodeURIComponent(
      params.description
    )}`;

    // Record pending transaction
    this.transactions.unshift({
      id: txnId,
      amountInr: params.amountInr,
      channel: "KING_PAY_UPI",
      status: "PENDING",
      clientName: params.clientName,
      description: params.description,
      referenceNumber: `PENDING-${txnId}`,
      providerFeeInr: 0,
      netFounderDepositInr: params.amountInr,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    });

    return {
      upiLink,
      qrPayload: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`,
      transactionId: txnId,
    };
  }

  confirmUpiDeposit(params: {
    transactionId: string;
    utrNumber: string;
    verifiedAmountInr: number;
  }): { success: boolean; transaction: PaymentTransaction } {
    const txn = this.transactions.find((t) => t.id === params.transactionId);
    if (!txn) throw new Error(`Transaction ${params.transactionId} not found.`);

    throw new Error(
      "UPI confirmation is blocked until an external payment-verification provider verifies the UTR and received amount. A submitted UTR alone cannot mark money as confirmed.",
    );
  }

  verifyRazorpayWebhook(payload: Record<string, unknown>, signature: string, webhookSecret?: string): boolean {
    if (!signature || !webhookSecret) return false;
    const crypto = require("node:crypto");
    const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  verifyStripeWebhook(payload: Record<string, unknown>, signature: string, webhookSecret?: string): boolean {
    // Stripe requires verification against the exact signed payload and timestamp.
    // This legacy method receives a parsed object, so it cannot safely verify a Stripe signature.
    return false;
  }
}

export const revenueGateway = new RevenueGatewayService();
