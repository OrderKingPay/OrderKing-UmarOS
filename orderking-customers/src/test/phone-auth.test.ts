import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  sanitizeIndianPhone,
  isValidIndianPhone,
  buildWhatsAppOtpUrl,
  getAvailableSmsProviders,
  dispatchOtpSms,
} from "../lib/server/sms-gateway";

describe("Customer App - Phone Auth & SMS Gateway Test Suite", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.SMS_GATEWAY_API_KEY;
    delete process.env.TWOFACTOR_API_KEY;
    delete process.env.MSG91_AUTH_KEY;
    delete process.env.TWILIO_ACCOUNT_SID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("1. correctly sanitizes and validates 10-digit Indian numbers", () => {
    expect(sanitizeIndianPhone("+91 93950 65587")).toBe("9395065587");
    expect(sanitizeIndianPhone("09395065587")).toBe("9395065587");
    expect(sanitizeIndianPhone("919395065587")).toBe("9395065587");
    expect(isValidIndianPhone("9395065587")).toBe(true);
    expect(isValidIndianPhone("5123456789")).toBe(false);
    expect(isValidIndianPhone("939506558")).toBe(false);
  });

  it("2. builds accurate WhatsApp deep-link with URL-encoded OTP", () => {
    const url = buildWhatsAppOtpUrl("9395065587", "847291", "OrderKing");
    expect(url).toContain("https://wa.me/919395065587");
    expect(url).toContain(encodeURIComponent("847291"));
    expect(url).toContain(encodeURIComponent("OrderKing"));
  });

  it("3. handles direct WhatsApp channel request", async () => {
    const result = await dispatchOtpSms({
      phone: "9395065587",
      otp: "123456",
      channel: "whatsapp",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("whatsapp");
    expect(result.debugOtp).toBe("123456");
    expect(result.whatsAppOtpUrl).toContain("https://wa.me/919395065587");
  });

  it("4. falls back to resilient zero-lockout emergency mode when keys are unconfigured", async () => {
    const result = await dispatchOtpSms({
      phone: "9395065587",
      otp: "654321",
      channel: "sms",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("resilient_fallback");
    expect(result.debugOtp).toBe("654321");
    expect(result.whatsAppOtpUrl).toBeDefined();
  });

  it("5. identifies fast2sms when valid key is present", () => {
    process.env.FAST2SMS_API_KEY = "test_f2s_key";
    const providers = getAvailableSmsProviders();
    expect(providers).toContain("fast2sms");
  });
});
