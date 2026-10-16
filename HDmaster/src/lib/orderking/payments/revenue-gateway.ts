// Legitimate Payment & Revenue Gateway Integration
// Supports King Pay UPI, Razorpay, and Stripe with Webhook Verification and Zero-Fabrication Integrity

import {
  generateUpiIntent,
  generateDynamicQrContract,
  type DynamicQrContract,
  type DynamicQrMode,
} from "./upi.ts";
import { verifyWebhookSignature, verifyRazorpayWebhookHeader } from "./razorpay.server.ts";
import { verifyStripeWebhook } from "./crypto-webhook.ts";
import { paymentIdempotency } from "./idempotency.ts";

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
    // Calculate what would have been lost if standard 2.5% card/gateway fees applied
    const savedFees = confirmed.reduce(
      (acc, t) => (t.channel === "KING_PAY_UPI" ? acc + Math.round(t.amountInr * 0.025) : acc),
      0
    );

    return {
      totalGrossInr: totalGross,
      netFounderDepositedInr: netFounder,
      totalSavedGatewayFeesInr: savedFees,
      confirmedTransactionsCount: confirmed.length,
      pendingInvoicesCount: this.transactions.filter((t) => t.status === "PENDING").length,
      pendingInvoicesValueInr: this.transactions
        .filter((t) => t.status === "PENDING")
        .reduce((acc, t) => acc + t.amountInr, 0),
    };
  }

  /**
   * Generates production-grade UPI payment intent link & QR payload
   * Payload: upi://pay?pa=...&pn=OrderKing&am=...&cu=INR&tr=...
   */
  createUpiPaymentLink(params: {
    amountInr: number;
    clientName: string;
    description: string;
    founderVpa?: string;
    customTxnId?: string;
  }): { upiLink: string; qrPayload: string; transactionId: string; deepLinks: Record<string, string> } {
    if (!params.founderVpa || !Number.isFinite(params.amountInr) || params.amountInr <= 0) {
      throw new Error("CONFIGURATION_REQUIRED: verified founderVpa and positive amountInr are required");
    }
    const txnId = params.customTxnId || `TXN-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // Generate canonical NPCI payload with required format
    const upiResult = generateUpiIntent({
      payeeVpa: params.founderVpa,
      payeeName: "OrderKing",
      amountInr: params.amountInr,
      transactionRef: txnId,
      transactionNote: params.description,
      merchantCategoryCode: "5812",
    });

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
      metadata: { upiUri: upiResult.rawUri },
    });

    return {
      upiLink: upiResult.rawUri,
      qrPayload: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiResult.rawUri)}`,
      transactionId: txnId,
      deepLinks: upiResult.deepLinks,
    };
  }

  /**
   * Generates a formal UPI Dynamic QR contract for on-counter or on-app checkout
   */
  createDynamicUpiQr(params: {
    mode: DynamicQrMode;
    amountInr: number;
    payeeVpa: string;
    clientName?: string;
    description?: string;
    terminalId?: string;
    counterId?: string;
    tableId?: string;
    expiryMinutes?: number;
    soundboxSync?: boolean;
  }): DynamicQrContract {
    const txnRef = `TR-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const contract = generateDynamicQrContract({
      mode: params.mode,
      payeeVpa: params.payeeVpa,
      payeeName: "OrderKing",
      amountInr: params.amountInr,
      transactionRef: txnRef,
      note: params.description || `OrderKing Counter Bill`,
      terminalId: params.terminalId,
      counterId: params.counterId,
      expiryMinutes: params.expiryMinutes,
      soundboxSync: params.soundboxSync ?? true,
    });

    // Enforce idempotency reservation
    paymentIdempotency.assertOrderNotSettled(txnRef);

    return contract;
  }

  /**
   * Confirms a UPI deposit with strict provider verification and double-spend prevention
   */
  confirmUpiDeposit(params: {
    transactionId: string;
    utrNumber: string;
    verifiedAmountInr: number;
    isVerifiedByProvider?: boolean;
  }): { success: boolean; transaction: PaymentTransaction } {
    const txn = this.transactions.find((t) => t.id === params.transactionId);
    if (!txn) throw new Error(`Transaction ${params.transactionId} not found.`);

    if (txn.status === "CONFIRMED") {
      throw new Error(`Double-spend prevented: Transaction ${params.transactionId} is already CONFIRMED.`);
    }

    if (!params.isVerifiedByProvider) {
      throw new Error("PROVIDER_VERIFICATION_REQUIRED: UTR confirmation cannot be accepted from client input alone");
    }

    // Double-spend check on UTR
    paymentIdempotency.recordPaymentCapture({
      paymentId: params.utrNumber,
      orderId: params.transactionId,
      amountPaise: Math.round(params.verifiedAmountInr * 100),
      method: "upi",
    });

    txn.status = "CONFIRMED";
    txn.referenceNumber = params.utrNumber;
    txn.settledAt = new Date().toISOString();

    return { success: true, transaction: txn };
  }

  /**
   * Cryptographically verifies Razorpay webhook signature (X-Razorpay-Signature)
   */
  verifyRazorpayWebhook(
    payload: string | Record<string, unknown>,
    signature: string,
    webhookSecret?: string
  ): boolean {
    const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
    return verifyRazorpayWebhookHeader(rawBody, signature, webhookSecret);
  }

  /**
   * Cryptographically verifies Stripe webhook signature (stripe-signature)
   */
  verifyStripeWebhook(
    payload: string | Record<string, unknown>,
    signatureHeader: string,
    webhookSecret?: string
  ): boolean {
    const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
    const secret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "";
    try {
      return verifyStripeWebhook(rawBody, signatureHeader, secret);
    } catch {
      return false;
    }
  }

  /**
   * Resets transactions list (for testing)
   */
  clear(): void {
    this.transactions = [];
  }
}

export const revenueGateway = new RevenueGatewayService();
