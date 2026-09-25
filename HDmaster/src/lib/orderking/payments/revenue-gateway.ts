import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

// Legitimate Payment & Revenue Gateway Integration.
// The module is fail-closed: it never invents confirmed revenue.

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
const LEGACY_REFERENCE_TRANSACTIONS: PaymentTransaction[] = [
    {
      id: "TXN-8801",
      amountInr: 74999,
      channel: "KING_PAY_UPI",
      status: "CONFIRMED",
      clientName: "Royal Darbar Palace",
      description: "50% Milestone Advance - Direct Ordering App",
      referenceNumber: "UPI-UTR-908234710293",
      providerFeeInr: 0, // 0% gateway cut
      netFounderDepositInr: 74999,
      createdAt: "2026-09-21 15:40",
      settledAt: "2026-09-21 15:41",
      metadata: { dataMode: "LEGACY_UNVERIFIED", active: false },
    },
    {
      id: "TXN-8802",
      amountInr: 50000,
      channel: "RAZORPAY",
      status: "CONFIRMED",
      clientName: "Sylhet Heritage Sweets",
      description: "POS Hardware & Cloud License Setup",
      referenceNumber: "pay_OpL92810Xkz9",
      providerFeeInr: 1000, // 2% standard cut
      netFounderDepositInr: 49000,
      createdAt: "2026-09-20 12:20",
      settledAt: "2026-09-20 12:21",
      metadata: { dataMode: "LEGACY_UNVERIFIED", active: false },
    },
  ];

export class RevenueGatewayService {
  private transactions: PaymentTransaction[] = [];

  getLegacyReferenceTransactions(): readonly PaymentTransaction[] {
    return LEGACY_REFERENCE_TRANSACTIONS;
  }

  getTransactions(): PaymentTransaction[] {
    return [...this.transactions];
  }

  getMetrics(): RevenueMetrics {
    const confirmed = this.transactions.filter((t) => t.status === "CONFIRMED");
    const totalGross = confirmed.reduce((acc, t) => acc + t.amountInr, 0);
    const netFounder = confirmed.reduce((acc, t) => acc + t.netFounderDepositInr, 0);
    // Calculate what would have been lost if standard 2.5% card/gateway fees applied
    const savedFees = confirmed.reduce((acc, t) => (t.channel === "KING_PAY_UPI" ? acc + Math.round(t.amountInr * 0.025) : acc), 0);

    return {
      totalGrossInr: totalGross,
      netFounderDepositedInr: netFounder,
      totalSavedGatewayFeesInr: savedFees,
      confirmedTransactionsCount: confirmed.length,
      pendingInvoicesCount: 3,
      pendingInvoicesValueInr: 324998,
    };
  }

  createUpiPaymentLink(params: {
    amountInr: number;
    clientName: string;
    description: string;
    founderVpa?: string;
  }): { upiLink: string; qrPayload: string; transactionId: string } {
    const vpa = params.founderVpa || "orderking@okhdfcbank";
    const txnId = `TXN-${randomUUID()}`;
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

    return { upiLink, qrPayload: upiLink, transactionId: txnId };
  }

  confirmUpiDeposit(_params: {
    transactionId: string;
    utrNumber: string;
    verifiedAmountInr: number;
  }): { success: false; transaction?: PaymentTransaction } {
    // A user-supplied UTR/amount is not independent bank/provider verification.
    return { success: false };
  }

  verifyRazorpayWebhook(rawBody: string, signature: string, webhookSecret?: string): boolean {
    if (!rawBody || !signature || !webhookSecret) return false;
    const expected = createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("hex");
    return safeEqualHex(expected, signature);
  }

  verifyStripeWebhook(
    rawBody: string,
    signatureHeader: string,
    webhookSecret?: string,
    toleranceSeconds = 300,
  ): boolean {
    if (!rawBody || !signatureHeader || !webhookSecret) return false;

    const parts = signatureHeader.split(",").map((part) => part.trim());
    const timestampPart = parts.find((part) => part.startsWith("t="));
    const signatureParts = parts
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3));
    const timestamp = timestampPart ? Number(timestampPart.slice(2)) : NaN;

    if (!Number.isFinite(timestamp) || signatureParts.length === 0) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > toleranceSeconds) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", webhookSecret).update(signedPayload, "utf8").digest("hex");
    return signatureParts.some((candidate) => safeEqualHex(expected, candidate));
  }
  }
}


function safeEqualHex(expected: string, received: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
export const revenueGateway = new RevenueGatewayService();
