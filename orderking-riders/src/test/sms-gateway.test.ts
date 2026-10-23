import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  sanitizeIndianPhone,
  isValidIndianPhone,
  buildWhatsAppOtpUrl,
  getAvailableSmsProviders,
  dispatchOtpSms,
} from "../lib/server/sms-gateway";

describe("OrderKing Telecom & SMS Gateway Dispatch Engine", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.SMS_GATEWAY_API_KEY;
    delete process.env.TWOFACTOR_API_KEY;
    delete process.env.TWO_FACTOR_API_KEY;
    delete process.env.TWO_FACTOR_SMS_KEY;
    delete process.env.MSG91_AUTH_KEY;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_PHONE;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("1. Phone Number Sanitization & Validation", () => {
    it("strips +91, 91, 0, spaces, and dashes", () => {
      expect(sanitizeIndianPhone("+91 98765 43210")).toBe("9876543210");
      expect(sanitizeIndianPhone("+91-98765-43210")).toBe("9876543210");
      expect(sanitizeIndianPhone("919876543210")).toBe("9876543210");
      expect(sanitizeIndianPhone("09876543210")).toBe("9876543210");
      expect(sanitizeIndianPhone("9876543210")).toBe("9876543210");
    });

    it("validates 10-digit Indian mobile numbers starting with 6, 7, 8, 9", () => {
      expect(isValidIndianPhone("9876543210")).toBe(true);
      expect(isValidIndianPhone("8123456789")).toBe(true);
      expect(isValidIndianPhone("7012345678")).toBe(true);
      expect(isValidIndianPhone("6290123456")).toBe(true);

      expect(isValidIndianPhone("5123456789")).toBe(false);
      expect(isValidIndianPhone("987654321")).toBe(false);
      expect(isValidIndianPhone("98765432100")).toBe(false);
      expect(isValidIndianPhone("abcdefghij")).toBe(false);
    });

    it("throws INVALID_PHONE error if phone number is invalid in dispatchOtpSms", async () => {
      await expect(
        dispatchOtpSms({ phone: "12345", otp: "123456" }),
      ).rejects.toThrow("valid 10-digit Indian mobile number");
    });
  });

  describe("2. WhatsApp OTP delivery safety", () => {
    it("does not put a secret into an outgoing chat link", () => {
      const url = buildWhatsAppOtpUrl("9876543210", "482910", "OrderKing");
      expect(url).toBe("https://wa.me/919876543210");
      expect(url).not.toContain("482910");
    });

    it("fails closed without a real WhatsApp provider", async () => {
      const res = await dispatchOtpSms({ phone: "9876543210", otp: "889900", channel: "whatsapp" });
      expect(res.success).toBe(false);
      expect(res.provider).toBe("unavailable");
      expect(res.debugOtp).toBeUndefined();
      expect(res.whatsAppOtpUrl).toBeUndefined();
    });
  });

  describe("3. Unconfigured SMS provider safety", () => {
    it("never issues a successful or browser-visible OTP without a provider", async () => {
      expect(getAvailableSmsProviders()).toEqual([]);
      const res = await dispatchOtpSms({ phone: "9876543210", otp: "654321" });
      expect(res.success).toBe(false);
      expect(res.pendingConfig).toBe(true);
      expect(res.provider).toBe("unavailable");
      expect(res.debugOtp).toBeUndefined();
      expect(res.whatsAppOtpUrl).toBeUndefined();
    });
  });

  describe("4. Fast2SMS Quick SMS / OTP Gateway", () => {
    it("dispatches live SMS via Fast2SMS API with authorization header", async () => {
      process.env.FAST2SMS_API_KEY = "mock_f2s_key_123";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          request_id: "REQ_F2S_778899",
          message: ["SMS sent successfully."],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "778899",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("fast2sms");
      expect(res.messageId).toBe("REQ_F2S_778899");
      expect(res.debugOtp).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://www.fast2sms.com/dev/bulkV2");
      expect(options.method).toBe("POST");
      expect(options.headers.authorization).toBe("mock_f2s_key_123");
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.route).toBe("otp");
      expect(parsedBody.variables_values).toBe("778899");
      expect(parsedBody.numbers).toBe("9876543210");
    });
  });

  describe("5. 2Factor.in Gateway", () => {
    it("dispatches live SMS via 2Factor AUTOGEN endpoint", async () => {
      process.env.TWOFACTOR_API_KEY = "mock_2factor_key_456";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Status: "Success",
          Details: "2F_SESSION_UUID_999",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "112233",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("2factor");
      expect(res.messageId).toBe("2F_SESSION_UUID_999");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("https://2factor.in/v1/API/V1/mock_2factor_key_456/SMS/9876543210/112233/AUTOGEN");
      expect(options.method).toBe("GET");
    });
  });

  describe("6. MSG91 OTP Gateway", () => {
    it("dispatches live SMS via MSG91 OTP API with authkey and 91 prefix", async () => {
      process.env.MSG91_AUTH_KEY = "mock_msg91_key_789";
      process.env.MSG91_OTP_TEMPLATE_ID = "TPL_6677";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          type: "success",
          message: "OTP sent successfully",
          request_id: "MSG91_REQ_4455",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "334455",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("msg91");
      expect(res.messageId).toBe("MSG91_REQ_4455");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://control.msg91.com/api/v5/otp");
      expect(options.headers.authkey).toBe("mock_msg91_key_789");
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.mobile).toBe("919876543210");
      expect(parsedBody.otp).toBe("334455");
      expect(parsedBody.template_id).toBe("TPL_6677");
    });
  });

  describe("7. Twilio SMS Fallback Gateway", () => {
    it("dispatches live SMS via Twilio API with Basic Auth", async () => {
      process.env.TWILIO_ACCOUNT_SID = "AC_mock_twilio_sid";
      process.env.TWILIO_AUTH_TOKEN = "mock_twilio_token";
      process.env.TWILIO_FROM_PHONE = "+12025550199";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sid: "SM_twilio_message_sid_123",
          status: "queued",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "556677",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("twilio");
      expect(res.messageId).toBe("SM_twilio_message_sid_123");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC_mock_twilio_sid/Messages.json");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toContain("Basic ");
      expect(options.body).toContain("To=%2B919876543210");
    });
  });

  describe("8. Automatic Multi-Gateway Failover", () => {
    it("fails over from Fast2SMS to 2Factor if Fast2SMS returns 500 error", async () => {
      process.env.FAST2SMS_API_KEY = "f2s_key";
      process.env.TWOFACTOR_API_KEY = "2factor_key";

      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            Status: "Success",
            Details: "2F_FAILOVER_SUCCESS_ID",
          }),
        });
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "990011",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("2factor");
      expect(res.messageId).toBe("2F_FAILOVER_SUCCESS_ID");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("9. Provider outage fails closed", () => {
    it("never treats delivery failure as verified authentication", async () => {
      process.env.FAST2SMS_API_KEY = "f2s_key";

      const mockFetch = vi.fn().mockRejectedValue(new Error("Network timeout after 5000ms"));
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "123987",
      });

      expect(res.success).toBe(false);
      expect(res.provider).toBe("unavailable");
      expect(res.debugOtp).toBeUndefined();
      expect(res.error).toContain("Network timeout");
      expect(res.whatsAppOtpUrl).toBeUndefined();
    });
  });
});
