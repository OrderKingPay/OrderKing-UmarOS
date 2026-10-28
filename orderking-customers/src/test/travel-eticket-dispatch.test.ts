import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  dispatchBookingConfirmationTelecom,
  type TravelBookingNotificationPayload,
} from "../lib/server/sms-gateway";
import { Route } from "../routes/api/travel/booking-confirmed";

describe("Travel E-Ticket & PNR Automated Telecom Dispatch Suite", () => {
  const originalEnv = { ...process.env };

  const validBookingPayload: TravelBookingNotificationPayload = {
    recipientPhone: "9876543210",
    customerName: "Ramesh Sharma",
    bookingId: "BK-88492019",
    pnr: "6E99AB",
    serviceType: "FLIGHT",
    carrierName: "IndiGo",
    serviceNumber: "6E-2041",
    origin: "Guwahati (GAU)",
    destination: "Silchar (IXS)",
    departureTime: "10:30 AM",
    travelDate: "2026-11-05",
    totalPaidPaise: 345000,
    pdfVoucherUrl: "https://orderkingpay.com/travel/voucher/BK-88492019.pdf",
  };

  beforeEach(() => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.SMS_GATEWAY_API_KEY;
    delete process.env.FAST2SMS_ROUTE;
    delete process.env.FAST2SMS_SENDER_ID;
    delete process.env.FAST2SMS_DLT_BOOKING_TE_ID;
    delete process.env.FAST2SMS_DLT_TE_ID;
    delete process.env.FAST2SMS_OTP_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("1. rejects invalid passenger mobile numbers before attempting telecom dispatch", async () => {
    await expect(
      dispatchBookingConfirmationTelecom({
        ...validBookingPayload,
        recipientPhone: "12345",
      }),
    ).rejects.toThrow(/Invalid recipient phone number/);

    await expect(
      dispatchBookingConfirmationTelecom({
        ...validBookingPayload,
        recipientPhone: "5123456789", // starts with 5 (invalid in India)
      }),
    ).rejects.toThrow(/Invalid recipient phone number/);
  });

  it("2. dispatches official PNR confirmation and PDF voucher directly to WhatsApp via Meta Graph API v21.0", async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = "EAABtest_token_live";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "109876543210";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messaging_product: "whatsapp",
        messages: [{ id: "wamid.HBgMOTE5ODc2NTQzMjEwFQIAERgSRTIy" }],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await dispatchBookingConfirmationTelecom(validBookingPayload);

    expect(result.success).toBe(true);
    expect(result.channelUsed).toBe("whatsapp");
    expect(result.whatsappDelivered).toBe(true);
    expect(result.smsDelivered).toBe(false);
    expect(result.pnr).toBe("6E99AB");
    expect(result.bookingId).toBe("BK-88492019");
    expect(result.messageId).toBe("wamid.HBgMOTE5ODc2NTQzMjEwFQIAERgSRTIy");
    expect(result.notice).toContain("dispatched directly to passenger WhatsApp (+91-9876543210)");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://graph.facebook.com/v21.0/109876543210/messages");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer EAABtest_token_live");

    const sentBody = JSON.parse(options.body);
    expect(sentBody.messaging_product).toBe("whatsapp");
    expect(sentBody.to).toBe("919876543210");
    expect(sentBody.text.body).toContain("ORDERKING TRAVEL CONFIRMATION");
    expect(sentBody.text.body).toContain("PNR / Ticket: *6E99AB*");
    expect(sentBody.text.body).toContain("e-Ticket / PDF Voucher: https://orderkingpay.com/travel/voucher/BK-88492019.pdf");
    expect(sentBody.text.body).toContain("18AFXPH9838M1Z9");
  });

  it("3. falls back immediately to Fast2SMS TRAI DLT corridor if WhatsApp fails transiently", async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = "EAABtest_token_live";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "109876543210";
    process.env.FAST2SMS_API_KEY = "f2s_prod_key_7788";
    process.env.FAST2SMS_ROUTE = "dlt";
    process.env.FAST2SMS_SENDER_ID = "ORDKNG";
    process.env.FAST2SMS_DLT_BOOKING_TE_ID = "1207161728392019999";

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("graph.facebook.com")) {
        // WhatsApp transient network error or quota exhaustion
        return Promise.reject(new Error("Network timeout after 5000ms"));
      }
      if (url.includes("fast2sms.com")) {
        // Fast2SMS DLT success
        return Promise.resolve({
          ok: true,
          json: async () => ({
            return: true,
            request_id: "REQ_F2S_DLT_PNR_9988",
            message: ["DLT SMS sent successfully."],
          }),
        });
      }
      return Promise.reject(new Error("Unexpected endpoint"));
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await dispatchBookingConfirmationTelecom(validBookingPayload);

    expect(result.success).toBe(true);
    expect(result.channelUsed).toBe("fast2sms_dlt");
    expect(result.whatsappDelivered).toBe(false);
    expect(result.smsDelivered).toBe(true);
    expect(result.messageId).toBe("REQ_F2S_DLT_PNR_9988");
    expect(result.notice).toContain("Dispatched via Fast2SMS TRAI DLT corridor (Sender: ORDKNG)");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [dltUrl, dltOptions] = mockFetch.mock.calls[1];
    expect(dltUrl).toBe("https://www.fast2sms.com/dev/bulkV2");
    const dltBody = JSON.parse(dltOptions.body);
    expect(dltBody.route).toBe("dlt");
    expect(dltBody.sender_id).toBe("ORDKNG");
    expect(dltBody.message).toBe("1207161728392019999");
    expect(dltBody.numbers).toBe("9876543210");
  });

  it("4. falls back to Fast2SMS Smart OTP corridor when FAST2SMS_OTP_ID is configured", async () => {
    process.env.FAST2SMS_API_KEY = "f2s_prod_key_7788";
    process.env.FAST2SMS_ROUTE = "otp";
    process.env.FAST2SMS_OTP_ID = "88991122";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        return: true,
        request_id: "REQ_F2S_SMART_1234",
        message: ["Smart OTP sent."],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await dispatchBookingConfirmationTelecom(validBookingPayload);

    expect(result.success).toBe(true);
    expect(result.channelUsed).toBe("fast2sms_smart");
    expect(result.smsDelivered).toBe(true);
    expect(result.messageId).toBe("REQ_F2S_SMART_1234");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.fast2sms.com/dev/otp/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "f2s_prod_key_7788",
        }),
      }),
    );
  });

  it("5. falls back to Fast2SMS Quick route (route: 'q') when standard SMS is configured", async () => {
    process.env.FAST2SMS_API_KEY = "f2s_prod_key_7788";
    process.env.FAST2SMS_ROUTE = "q";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        return: true,
        request_id: "REQ_F2S_Q_5566",
        message: ["Quick SMS sent."],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await dispatchBookingConfirmationTelecom(validBookingPayload);

    expect(result.success).toBe(true);
    expect(result.channelUsed).toBe("fast2sms_q");
    expect(result.smsDelivered).toBe(true);
    expect(result.messageId).toBe("REQ_F2S_Q_5566");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.fast2sms.com/dev/bulkV2",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("6. operates in zero-lockout audit mode when credentials are unconfigured without crashing", async () => {
    const result = await dispatchBookingConfirmationTelecom(validBookingPayload);

    expect(result.success).toBe(true);
    expect(result.channelUsed).toBe("fallback_logged");
    expect(result.whatsappDelivered).toBe(false);
    expect(result.smsDelivered).toBe(false);
    expect(result.pnr).toBe("6E99AB");
    expect(result.notice).toContain("Telecom API credentials unconfigured in environment");
  });

  describe("7. End-to-End Route Handler Verification (/api/travel/booking-confirmed)", () => {
    it("handles GET request returning HEALTHY status and supported channels", async () => {
      const getHandler = (Route as any).options.server.handlers.GET;
      const request = new Request("http://localhost:3000/api/travel/booking-confirmed?bookingId=BK-88492019&pnr=6E99AB");
      const response = await getHandler({ request });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.status).toBe("HEALTHY");
      expect(json.gstin).toBe("18AFXPH9838M1Z9");
      expect(json.supportedChannels).toContain("Meta WhatsApp Cloud API v21.0");
      expect(json.query.pnr).toBe("6E99AB");
    });

    it("rejects POST requests with missing phone number with 400 Bad Request", async () => {
      const postHandler = (Route as any).options.server.handlers.POST;
      const request = new Request("http://localhost:3000/api/travel/booking-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "BK-1234" }),
      });
      const response = await postHandler({ request });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toBe("MISSING_PHONE");
    });

    it("executes automated outbound dispatch via POST request and returns 200 OK", async () => {
      process.env.WHATSAPP_ACCESS_TOKEN = "EAABtest_token_live";
      process.env.WHATSAPP_PHONE_NUMBER_ID = "109876543210";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [{ id: "wamid.ROUTE_HANDLER_TEST_99" }],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const postHandler = (Route as any).options.server.handlers.POST;
      const request = new Request("http://localhost:3000/api/travel/booking-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "+91 98765 43210",
          bookingId: "BK-88492019",
          pnr: "6E99AB",
          customerName: "Ramesh Sharma",
          serviceType: "FLIGHT",
          carrierName: "IndiGo",
          origin: "Guwahati (GAU)",
          destination: "Silchar (IXS)",
          departureTime: "10:30 AM",
          travelDate: "2026-11-05",
          totalPaidPaise: 345000,
        }),
      });
      const response = await postHandler({ request });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.channelUsed).toBe("whatsapp");
      expect(json.data.messageId).toBe("wamid.ROUTE_HANDLER_TEST_99");
      expect(json.data.pnr).toBe("6E99AB");
      expect(json.data.pdfVoucherUrl).toContain("BK-88492019.pdf");
    });
  });
});
