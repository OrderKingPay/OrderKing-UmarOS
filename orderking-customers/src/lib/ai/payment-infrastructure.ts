
/**
 * HDmaster Founder AI — Automatic Revenue Collection & Payment Infrastructure (§10)
 *
 * Supported Payment Workflows:
 * - Invoices (Tax-compliant GST/International)
 * - Payment Links (Direct UPI VPA & Global Stripe)
 * - Milestone Deposits & Escrow Locks
 * - Subscriptions & Recurring Retainers
 * - Webhook Verification & Cryptographic Receipts
 * - Refunds & Chargeback Handlers
 * - Revenue Reconciliation
 *
 * Strict Rule: A payment CANNOT become "RECEIVED" until the provider
 * (Bank, Razorpay, Stripe, UPI UTR) actually confirms it.
 */

export type PaymentMethod = "UPI_DIRECT" | "RAZORPAY" | "STRIPE" | "BANK_WIRE";

export type InvoicePaymentStatus = "DRAFT" | "ISSUED" | "ESCROW_LOCKED" | "RECEIVED" | "REFUNDED";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceInr: number;
  totalInr: number;
}

export interface ClientInvoiceRecord {
  id: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  items: InvoiceItem[];
  subtotalInr: number;
  taxInr: number;
  totalInr: number;
  paymentMethod: PaymentMethod;
  status: InvoicePaymentStatus;
  paymentLink: string;
  qrPayload: string;
  issuedAt: string;
  paidAt?: string;
  providerEventId?: string;
  reconciled: boolean;
}

export interface PaymentWebhookPayload {
  eventId: string;
  provider: "RAZORPAY" | "STRIPE" | "UPI_BANK";
  eventType: "payment.captured" | "checkout.session.completed" | "bank.settlement.received";
  amount: number;
  currency: string;
  invoiceId: string;
  signature: string;
  timestamp: string;
}

export const INITIAL_CLIENT_INVOICES: ClientInvoiceRecord[] = [];

export function verifyAndProcessWebhook(
  payload: PaymentWebhookPayload,
  invoices: ClientInvoiceRecord[]
): {
  success: boolean;
  invoice?: ClientInvoiceRecord;
  error?: string;
} {
  // Enforce provider-specific HMAC verification. The webhook payload passed to this
  // function must be the canonical body fields used by the integration layer.
  if (!payload.signature || payload.signature.length < 8) {
    return { success: false, error: "CRYPTOGRAPHIC_SIGNATURE_INVALID: Missing or malformed provider signature" };
  }

  const secretEnv =
    payload.provider === "RAZORPAY" ? "RAZORPAY_WEBHOOK_SECRET" :
    payload.provider === "STRIPE" ? "STRIPE_WEBHOOK_SECRET" :
    "UPI_BANK_WEBHOOK_SECRET";
  const secret = process.env[secretEnv]?.trim();
  if (!secret) {
    return { success: false, error: `PROVIDER_CONFIGURATION_REQUIRED: ${secretEnv} is missing` };
  }

  const crypto = require("node:crypto");
  const canonical = JSON.stringify({
    eventId: payload.eventId,
    provider: payload.provider,
    eventType: payload.eventType,
    amount: payload.amount,
    currency: payload.currency,
    invoiceId: payload.invoiceId,
    timestamp: payload.timestamp,
  });
  const expected = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  const given = payload.signature.trim().toLowerCase();
  const valid = given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) {
    return { success: false, error: "CRYPTOGRAPHIC_SIGNATURE_INVALID: Provider signature verification failed" };
  }

  const invoice = invoices.find((inv) => inv.id === payload.invoiceId);
  if (!invoice) {
    return { success: false, error: `INVOICE_NOT_FOUND: No invoice matches ID ${payload.invoiceId}` };
  }

  if (invoice.totalInr !== payload.amount) {
    return {
      success: false,
      error: `AMOUNT_MISMATCH: Expected ₹${invoice.totalInr}, but provider reported ₹${payload.amount}`,
    };
  }

  // Mark invoice as received with provider confirmation
  const updatedInvoice: ClientInvoiceRecord = {
    ...invoice,
    status: "RECEIVED",
    paidAt: new Date().toISOString(),
    providerEventId: payload.eventId,
    reconciled: true,
  };

  return { success: true, invoice: updatedInvoice };
}
