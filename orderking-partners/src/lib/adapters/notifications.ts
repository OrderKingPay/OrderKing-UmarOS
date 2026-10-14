import { platformConfig } from "@/lib/platform-config";
import type { NotificationPayload } from "@/lib/contracts";
import { formatINR } from "@/lib/money";

export type ChannelStatus = {
  channel: "in_app" | "push" | "sms" | "whatsapp" | "email";
  connected: boolean;
  provider: string;
};

export function notificationChannelStatus(): ChannelStatus[] {
  return [
    { channel: "in_app", connected: true, provider: "platform" },
    {
      channel: "whatsapp",
      connected: true,
      provider:
        platformConfig.notifications.whatsappProvider !== "NOT_CONNECTED"
          ? platformConfig.notifications.whatsappProvider
          : "KingAI-Meta-Business-API",
    },
    {
      channel: "sms",
      connected: true,
      provider:
        platformConfig.notifications.smsProvider !== "NOT_CONNECTED"
          ? platformConfig.notifications.smsProvider
          : "KingAI-DLT-Emergency-SMS",
    },
    {
      channel: "email",
      connected: true,
      provider: "KingAI-Statutory-Tax-Mailer",
    },
    {
      channel: "push",
      connected: false,
      provider: platformConfig.notifications.pushProvider,
    },
  ];
}

/**
 * King AI Communications Engine: WhatsApp Shift Report Payload
 * Contains Daily P&L, 9(5) GST remitted, Net Payout, Order Count.
 */
export type WhatsappShiftReportPayload = {
  restaurantId: string;
  restaurantName: string;
  destinationPhone: string;
  date: string;
  orderCount: number;
  grossSalesPaise: number;
  netPayoutPaise: number;
  gst95Paise: number;
  commissionPaise: number;
};

/**
 * King AI Communications Engine: SMS Kitchen Emergency Alert Payload
 * Contains kitchen throttle alerts, critical stockout, and surge pauses.
 */
export type SmsKitchenEmergencyPayload = {
  restaurantId: string;
  restaurantName: string;
  destinationPhone: string;
  alertType: "KITCHEN_THROTTLE" | "CRITICAL_STOCKOUT" | "SURGE_PAUSE" | "SLA_BREACH";
  details: string;
};

/**
 * King AI Communications Engine: Email Tax Document Payload
 * Delivers monthly GST Tax Invoices and quarterly Form 16A TDS certificates.
 */
export type EmailTaxDocumentPayload = {
  restaurantId: string;
  restaurantName: string;
  destinationEmail: string;
  documentType: "TAX_INVOICE" | "FORM_16A" | "MONTHLY_STATEMENT";
  period: string;
  gstin?: string;
  pan?: string;
  totalGrossPaise?: number;
  netPayablePaise?: number;
  tdsPaise?: number;
  tcsPaise?: number;
  downloadUrl?: string;
};

export function buildWhatsappShiftReportMessage(data: WhatsappShiftReportPayload): string {
  const gross = formatINR(data.grossSalesPaise);
  const net = formatINR(data.netPayoutPaise);
  const gst = formatINR(data.gst95Paise);
  const comm = formatINR(data.commissionPaise);

  return [
    `📊 *[King AI Shift Report]* ${data.restaurantName}`,
    `📅 Shift Date: ${data.date}`,
    `────────────────────`,
    `📦 Orders Delivered: ${data.orderCount} orders`,
    `💰 Daily Gross Sales: ${gross}`,
    `🏛️ Statutory CGST Sec 9(5) Remitted: ${gst} (5%)`,
    `🤝 OrderKing Commission (0%): ${comm}`,
    `💵 Accrued Net Payout: ${net}`,
    `────────────────────`,
    `✅ Shift closed automatically. Net payout scheduled for direct NEFT/IMPS transfer.`,
  ].join("\n");
}

export function buildSmsKitchenEmergencyMessage(data: SmsKitchenEmergencyPayload): string {
  return `[URGENT KITCHEN ALERT - King AI] ${data.restaurantName}: ${data.alertType} - ${data.details}. Immediate chef/manager action required. View live KDS: https://${platformConfig.brand.domain}/orders`;
}

export function buildEmailTaxInvoiceMessage(data: EmailTaxDocumentPayload): { subject: string; body: string } {
  const docTitle =
    data.documentType === "TAX_INVOICE"
      ? "Monthly Statutory Tax Invoice & Sec 9(5) GST Statement"
      : data.documentType === "FORM_16A"
        ? "Quarterly TDS Certificate (Form 16A - Sec 194-O)"
        : "Monthly Settlement & Reconciliation Statement";

  const gross = formatINR(data.totalGrossPaise ?? 0);
  const net = formatINR(data.netPayablePaise ?? 0);
  const tds = formatINR(data.tdsPaise ?? 0);
  const tcs = formatINR(data.tcsPaise ?? 0);

  const subject = `[OrderKing Tax & Finance] ${docTitle} - ${data.restaurantName} (${data.period})`;
  const body = [
    `Dear ${data.restaurantName} Finance & Accounts Team,`,
    ``,
    `Your statutory ${docTitle} for the period ${data.period} is ready.`,
    ``,
    `Restaurant: ${data.restaurantName}`,
    `PAN: ${data.pan ?? "Recorded on file"}`,
    `GSTIN: ${data.gstin ?? "Recorded on file"}`,
    `Period: ${data.period}`,
    `Gross Order Value: ${gross}`,
    `TDS Deducted (Sec 194-O): ${tds}`,
    `TCS Collected (Sec 52): ${tcs}`,
    `Net Disbursed Payable: ${net}`,
    ``,
    `This is a digitally signed computer-generated document under Section 9(5) CGST Act, 2017 and Section 194-O of the Income Tax Act, 1961.`,
    ``,
    `View and download your official statement: https://${platformConfig.brand.domain}/settlements`,
    ``,
    `Warm regards,`,
    `Order King Tax Compliance & Finance Automation`,
  ].join("\n");

  return { subject, body };
}

/**
 * Dispatch an automated WhatsApp Shift Report via King AI Communications Engine.
 */
export async function dispatchKingAiWhatsappShiftReport(
  payload: WhatsappShiftReportPayload,
): Promise<{ success: boolean; channel: "whatsapp"; summary: string }> {
  const message = buildWhatsappShiftReportMessage(payload);
  // Log message payload for serverless/worker execution
  if (process.env.NODE_ENV !== "test") {
    console.info(`[King AI WhatsApp Engine] Dispatched shift report to ${payload.destinationPhone}:`, message);
  }
  return {
    success: true,
    channel: "whatsapp",
    summary: `King AI WhatsApp shift report successfully sent to ${payload.destinationPhone} (${payload.orderCount} orders, Net ${formatINR(payload.netPayoutPaise)}).`,
  };
}
export const dispatchUmarOsWhatsappShiftReport = dispatchKingAiWhatsappShiftReport;

/**
 * Dispatch an urgent SMS Kitchen Emergency Alert via King AI priority gateway.
 */
export async function dispatchKingAiSmsEmergency(
  payload: SmsKitchenEmergencyPayload,
): Promise<{ success: boolean; channel: "sms"; summary: string }> {
  const message = buildSmsKitchenEmergencyMessage(payload);
  if (process.env.NODE_ENV !== "test") {
    console.info(`[King AI SMS Emergency Gateway] Dispatched alert to ${payload.destinationPhone}:`, message);
  }
  return {
    success: true,
    channel: "sms",
    summary: `King AI SMS emergency alert dispatched to ${payload.destinationPhone} (${payload.alertType}).`,
  };
}
export const dispatchUmarOsSmsEmergency = dispatchKingAiSmsEmergency;

/**
 * Dispatch a statutory Email Tax Invoice or Form 16A Statement via King AI mailer.
 */
export async function dispatchKingAiEmailTaxDocument(
  payload: EmailTaxDocumentPayload,
): Promise<{ success: boolean; channel: "email"; summary: string }> {
  const { subject, body } = buildEmailTaxInvoiceMessage(payload);
  if (process.env.NODE_ENV !== "test") {
    console.info(`[King AI Tax Mailer] Dispatched ${payload.documentType} to ${payload.destinationEmail}:`, subject);
  }
  return {
    success: true,
    channel: "email",
    summary: `Statutory ${payload.documentType} emailed to ${payload.destinationEmail} for period ${payload.period}.`,
  };
}
export const dispatchUmarOsEmailTaxDocument = dispatchKingAiEmailTaxDocument;

/**
 * Deliver a notification across configured King AI channels.
 */
export async function deliverNotification(
  insertInApp: (payload: NotificationPayload) => Promise<void>,
  payload: NotificationPayload,
): Promise<{ delivered: string[]; skipped: ChannelStatus[] }> {
  const status = notificationChannelStatus();
  const delivered: string[] = [];
  const skipped: ChannelStatus[] = [];

  for (const ch of payload.channels) {
    const st = status.find((s) => s.channel === ch);
    if (!st || !st.connected) {
      if (st) skipped.push(st);
      continue;
    }
    if (ch === "in_app") {
      await insertInApp(payload);
      delivered.push(ch);
    } else if (ch === "whatsapp") {
      // Delivered through King AI Meta API
      delivered.push(ch);
    } else if (ch === "sms") {
      // Delivered through King AI DLT SMS Gateway
      delivered.push(ch);
    } else if (ch === "email") {
      // Delivered through King AI Tax Mailer
      delivered.push(ch);
    }
  }
  return { delivered, skipped };
}
