import { describe, it, expect } from "vitest";
import {
  notificationChannelStatus,
  buildWhatsappShiftReportMessage,
  buildSmsKitchenEmergencyMessage,
  buildEmailTaxInvoiceMessage,
  dispatchKingAiWhatsappShiftReport,
  dispatchKingAiSmsEmergency,
  dispatchKingAiEmailTaxDocument,
  dispatchUmarOsWhatsappShiftReport,
  dispatchUmarOsSmsEmergency,
  dispatchUmarOsEmailTaxDocument,
} from "@/lib/adapters/notifications";

describe("Notifications Adapter & Messaging Engine", () => {
  it("provides channel status without robotic phrasing or Umar in user-facing providers", () => {
    const channels = notificationChannelStatus();
    expect(channels.length).toBeGreaterThanOrEqual(4);

    for (const ch of channels) {
      expect(ch.provider.toLowerCase()).not.toContain("umar");
      expect(ch.provider.toLowerCase()).not.toContain("statutory");
    }

    const email = channels.find((c) => c.channel === "email");
    expect(email?.provider).toBe("KingAI-Tax-Mailer");
  });

  it("builds WhatsApp shift report with King AI branding and accurate Order King commission", () => {
    const msg = buildWhatsappShiftReportMessage({
      restaurantId: "rest_1",
      restaurantName: "Royal Awadh Darbar",
      destinationPhone: "+919876543210",
      date: "14/10/2026",
      orderCount: 42,
      grossSalesPaise: 1250000,
      netPayoutPaise: 1187500,
      gst95Paise: 62500,
      commissionPaise: 350000,
    });

    expect(msg).toContain("*[King AI Shift Report]* Royal Awadh Darbar");
    expect(msg).toContain("Shift Date: 14/10/2026");
    expect(msg).toContain("Orders Delivered: 42 orders");
    expect(msg).toContain("Order King Commission: ₹3,500.00");
    expect(msg).not.toContain("OrderKing");
    expect(msg).not.toContain("(0%)");
    expect(msg).not.toContain("Statutory");
    expect(msg).not.toContain("Umar");
    expect(msg).not.toContain("umar");
  });

  it("builds SMS emergency alerts with King AI header and urgent chef action tone", () => {
    const msg = buildSmsKitchenEmergencyMessage({
      restaurantId: "rest_1",
      restaurantName: "Royal Awadh Darbar",
      destinationPhone: "+919876543210",
      alertType: "KITCHEN_THROTTLE",
      details: "SLA adjusted to 35m due to peak surge",
    });

    expect(msg).toContain("[URGENT KITCHEN ALERT - King AI]");
    expect(msg).toContain("Royal Awadh Darbar: KITCHEN_THROTTLE");
    expect(msg).toContain("Immediate chef/manager action required");
    expect(msg).not.toContain("Umar");
    expect(msg).not.toContain("umar");
  });

  it("builds Email tax invoice with warm hospitality tone and optional GSTIN wording", () => {
    const { subject, body } = buildEmailTaxInvoiceMessage({
      restaurantId: "rest_1",
      restaurantName: "Royal Awadh Darbar",
      destinationEmail: "finance@royalawadh.in",
      documentType: "TAX_INVOICE",
      period: "October 2026",
      pan: "ABCDE1234F",
      totalGrossPaise: 1250000,
      netPayablePaise: 1187500,
      tdsPaise: 12500,
      tcsPaise: 6250,
    });

    expect(subject).toBe("[Order King Finance] Monthly GST Tax Invoice & Sec 9(5) Statement - Royal Awadh Darbar (October 2026)");
    expect(body).toContain("Dear Royal Awadh Darbar Hospitality & Accounts Team,");
    expect(body).toContain("Your Monthly GST Tax Invoice & Sec 9(5) Statement for the period October 2026 is ready.");
    expect(body).toContain("GSTIN: Recorded on file (optional for turnover < ₹20L)");
    expect(body).toContain("Order King Finance & Partner Relations");
    expect(body).not.toContain("Statutory");
    expect(body).not.toContain("OrderKing");
    expect(body).not.toContain("Umar");
    expect(body).not.toContain("Tax Compliance & Finance Automation");
  });

  it("verifies backward compatibility aliases match King AI functions", () => {
    expect(dispatchUmarOsWhatsappShiftReport).toBe(dispatchKingAiWhatsappShiftReport);
    expect(dispatchUmarOsSmsEmergency).toBe(dispatchKingAiSmsEmergency);
    expect(dispatchUmarOsEmailTaxDocument).toBe(dispatchKingAiEmailTaxDocument);
  });
});
