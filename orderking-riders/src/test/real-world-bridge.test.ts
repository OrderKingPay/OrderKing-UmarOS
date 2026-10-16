import { describe, it, expect, vi } from "vitest";
import {
  normalizeIndianPhone,
  getWhatsAppPhoneDigits,
  generateWhatsAppDirectUrl,
  openNativeTwoWheelerNavigation,
  initiateCustomerCall,
  detectPlatform,
} from "../lib/rider/real-world-bridge";

describe("real-world-bridge: Indian Phone & WhatsApp Normalization", () => {
  it("normalizes 10-digit Indian numbers to E.164 +91", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("+919876543210");
  });

  it("strips leading 0 and adds +91 for 11-digit numbers", () => {
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
  });

  it("handles numbers already prefixed with 91 or formatted with dashes/spaces", () => {
    expect(normalizeIndianPhone("919876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("(+91) 98765 43210")).toBe("+919876543210");
  });

  it("extracts clean WhatsApp digits without plus sign", () => {
    expect(getWhatsAppPhoneDigits("9876543210")).toBe("919876543210");
    expect(getWhatsAppPhoneDigits("+91 98765 43210")).toBe("919876543210");
  });

  it("generates 1-tap WhatsApp deep link with encoded message", () => {
    const url = generateWhatsAppDirectUrl("9876543210", "Order #OK-123 is arriving!");
    expect(url).toContain("https://wa.me/919876543210?text=");
    expect(url).toContain(encodeURIComponent("Order #OK-123 is arriving!"));
  });
});

describe("real-world-bridge: Native Two-Wheeler Navigation", () => {
  const lat = 22.5726;
  const lng = 88.3639;

  it("generates native Android intent with mode=b (bike / two-wheeler)", () => {
    const res = openNativeTwoWheelerNavigation(lat, lng, { platform: "android", autoLaunch: false });
    expect(res.androidIntent).toBe("google.navigation:q=22.5726,88.3639&mode=b");
    expect(res.activeUri).toBe("google.navigation:q=22.5726,88.3639&mode=b");
    expect(res.platform).toBe("android");
    expect(res.success).toBe(true);
  });

  it("generates iOS Google Maps deep link with bicycling mode and Apple Maps fallback", () => {
    const res = openNativeTwoWheelerNavigation(lat, lng, { platform: "ios", autoLaunch: false });
    expect(res.iosUri).toBe("comgooglemaps://?daddr=22.5726,88.3639&directionsmode=bicycling");
    expect(res.appleMapsUri).toContain("maps.apple.com");
    expect(res.activeUri).toBe(res.iosUri);
    expect(res.platform).toBe("ios");
  });

  it("generates Web fallback URL with travelmode=two-wheeler", () => {
    const res = openNativeTwoWheelerNavigation(lat, lng, { platform: "web", autoLaunch: false });
    expect(res.webFallback).toBe("https://www.google.com/maps/dir/?api=1&destination=22.5726,88.3639&travelmode=two-wheeler");
    expect(res.activeUri).toBe(res.webFallback);
    expect(res.platform).toBe("web");
  });

  it("handles edge cases and coordinates defaulting gracefully", () => {
    const res = openNativeTwoWheelerNavigation(NaN as any, undefined as any, { platform: "android", autoLaunch: false });
    expect(res.androidIntent).toBe("google.navigation:q=0,0&mode=b");
  });
});

describe("real-world-bridge: Dual-Mode Telephony Bridge & Automatic Fallback", () => {
  const orderId = "OK-998877";
  const riderPhone = "9876500001";
  const customerPhone = "9876500002";

  it("automatically falls back to direct tel:+91... and WhatsApp when no bridge credentials are provided", async () => {
    const res = await initiateCustomerCall({
      orderId,
      riderPhone,
      customerPhone,
      autoLaunchDialer: false,
    });

    expect(res.success).toBe(true);
    expect(res.channel).toBe("DIRECT_FALLBACK");
    expect(res.fallbackTriggered).toBe(true);
    expect(res.telUri).toBe("tel:+919876500002");
    expect(res.whatsAppUrl).toContain("https://wa.me/919876500002?text=");
    expect(res.whatsAppUrl).toContain("OK-998877");
  });

  it("immediately returns direct fallback when preferredProvider is DIRECT", async () => {
    const res = await initiateCustomerCall({
      orderId,
      riderPhone,
      customerPhone,
      preferredProvider: "DIRECT",
      autoLaunchDialer: false,
    });

    expect(res.channel).toBe("DIRECT_FALLBACK");
    expect(res.telUri).toBe("tel:+919876500002");
    expect(res.fallbackTriggered).toBe(true);
  });

  it("initiates Exotel call when credentials and fetchFn are supplied", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        Call: { Sid: "exo_test_session_123" },
      }),
    });

    const res = await initiateCustomerCall({
      orderId,
      riderPhone,
      customerPhone,
      preferredProvider: "EXOTEL",
      exotelConfig: {
        apiKey: "test_key",
        apiToken: "test_token",
        subdomain: "orderking",
        callerId: "08045671234",
      },
      fetchFn: mockFetch as any,
      autoLaunchDialer: false,
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.channel).toBe("EXOTEL");
    expect(res.fallbackTriggered).toBe(false);
    expect(res.bridgeSessionId).toBe("exo_test_session_123");
    expect(res.telUri).toBe("tel:+918045671234");
  });

  it("initiates Twilio call when credentials and fetchFn are supplied", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        sid: "CA_twilio_test_456",
      }),
    });

    const res = await initiateCustomerCall({
      orderId,
      riderPhone,
      customerPhone,
      preferredProvider: "TWILIO",
      twilioConfig: {
        accountSid: "AC123456789",
        authToken: "auth_test",
        fromNumber: "+918045679999",
      },
      fetchFn: mockFetch as any,
      autoLaunchDialer: false,
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(res.success).toBe(true);
    expect(res.channel).toBe("TWILIO");
    expect(res.fallbackTriggered).toBe(false);
    expect(res.bridgeSessionId).toBe("CA_twilio_test_456");
    expect(res.telUri).toBe("tel:+918045679999");
  });

  it("gracefully falls back to direct tel if Exotel and Twilio network requests fail", async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error("Network timeout to cloud telephony"));

    const res = await initiateCustomerCall({
      orderId,
      riderPhone,
      customerPhone,
      preferredProvider: "EXOTEL",
      exotelConfig: {
        apiKey: "test_key",
        apiToken: "test_token",
        subdomain: "orderking",
        callerId: "08045671234",
      },
      fetchFn: failingFetch as any,
      autoLaunchDialer: false,
    });

    expect(res.success).toBe(true);
    expect(res.channel).toBe("DIRECT_FALLBACK");
    expect(res.fallbackTriggered).toBe(true);
    expect(res.telUri).toBe("tel:+919876500002");
    expect(res.whatsAppUrl).toBeDefined();
    expect(res.error).toContain("Network timeout");
  });
});
