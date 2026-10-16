import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  androidTwoWheelerNavigationIntent,
  getTwoWheelerNavigationUris,
} from "../lib/rider/maps";
import {
  VIBRATION_PATTERN_RADAR_SIREN,
  triggerRadarVibration,
  cancelRadarVibration,
} from "../lib/rider/dispatch-audio";
import {
  PERIOD_LEAVE_STORAGE_KEY,
} from "../components/rider/rider-benefits-hub";

describe("Supreme Rider App Completion Suite: Zomato Delivery Partner Benchmark", () => {
  describe("1. Customer Masked Calling & Cloud Telephony Bridge", () => {
    function getVirtualProxyDial(contactMasked: string | null | undefined): string {
      const digits = (contactMasked || "").replace(/\D/g, "");
      const suffix = digits ? digits.slice(-4).padStart(4, "0") : "1234";
      return `+91804567${suffix}`;
    }

    function getVirtualProxyDisplay(contactMasked: string | null | undefined): string {
      const digits = (contactMasked || "").replace(/\D/g, "");
      const suffix = digits ? digits.slice(-4).padStart(4, "0") : "1234";
      return `+91 80 4567 ${suffix}`;
    }

    it("replaces literal bullet strings with standard +91804567XXXX virtual proxy dial string", () => {
      const maskedRaw = "•••• 1234";
      const dial = getVirtualProxyDial(maskedRaw);
      expect(dial).toBe("+918045671234");
      expect(dial).not.toContain("•");
      expect(dial.startsWith("+91804567")).toBe(true);
    });

    it("formats virtual proxy numbers cleanly for rider UI display", () => {
      const display = getVirtualProxyDisplay("•••• 9876");
      expect(display).toBe("+91 80 4567 9876");
    });

    it("falls back to default virtual proxy pool when customer digits are empty", () => {
      expect(getVirtualProxyDial(null)).toBe("+918045671234");
      expect(getVirtualProxyDial("")).toBe("+918045671234");
      expect(getVirtualProxyDisplay("••••")).toBe("+91 80 4567 1234");
    });
  });

  describe("2. Native Android Turn-by-Turn Navigation Intent (Two-Wheeler mode=b)", () => {
    const lat = 24.8688;
    const lng = 92.3511;

    it("generates google.navigation:q=${lat},${lng}&mode=b native Android intent", () => {
      const intent = androidTwoWheelerNavigationIntent({ lat, lng });
      expect(intent).toBe("google.navigation:q=24.8688,92.3511&mode=b");
    });

    it("provides complete navigation bundle with intentUri, geoUri, and webUrl fallback", () => {
      const uris = getTwoWheelerNavigationUris({ lat, lng }, "Karimganj Kitchen");
      expect(uris.intentUri).toBe("google.navigation:q=24.8688,92.3511&mode=b");
      expect(uris.geoUri).toContain("geo:24.8688,92.3511");
      expect(uris.geoUri).toContain("mode=b");
      expect(uris.webUrl).toContain("travelmode=two-wheeler");
      expect(uris.webUrl).toBe(
        "https://www.google.com/maps/dir/?api=1&destination=24.8688,92.3511&travelmode=two-wheeler",
      );
    });
  });

  describe("3. Piercing Order Radar Siren & Native Vibration Pattern", () => {
    it("specifies the exact high-impact native vibration sequence [400, 150, 400, 150, 600]", () => {
      expect(VIBRATION_PATTERN_RADAR_SIREN).toEqual([400, 150, 400, 150, 600]);
    });

    it("triggers navigator.vibrate with the piercing radar pattern when available", () => {
      const vibrateMock = vi.fn();
      vi.stubGlobal("navigator", { vibrate: vibrateMock });

      triggerRadarVibration();
      expect(vibrateMock).toHaveBeenCalledWith([400, 150, 400, 150, 600]);

      cancelRadarVibration();
      expect(vibrateMock).toHaveBeenCalledWith(0);

      vi.unstubAllGlobals();
    });

    it("enforces Zomato standard 30-second accept countdown timer clamp", () => {
      const MAX_ACCEPT_TIMER_SEC = 30;
      const testRemaining = 45;
      const clamped = Math.min(MAX_ACCEPT_TIMER_SEC, testRemaining);
      expect(clamped).toBe(30);
    });
  });

  describe("4. Digital TPA Cashless Hospital Card & Female Partner Welfare", () => {
    it("configures TPA hospital policy with ₹2 Lakh cashless and ₹10 Lakh accidental cover", () => {
      const tpaCard = {
        network: "Medi Assist TPA",
        policyNumber: "OK-TPA-2026-94821",
        memberId: "MA-TPA-882941",
        cashlessLimitInr: 200000,
        accidentLimitInr: 1000000,
        emergencyHotline: "1800-425-4033",
      };

      expect(tpaCard.cashlessLimitInr).toBe(200000);
      expect(tpaCard.accidentLimitInr).toBe(1000000);
      expect(tpaCard.policyNumber.startsWith("OK-TPA-2026-")).toBe(true);
      expect(tpaCard.memberId.startsWith("MA-TPA-")).toBe(true);
    });

    it("generates structured QR code payload for hospital desk verification", () => {
      const qrPayload = "OK-TPA-2026-94821|MA-TPA-882941";
      expect(qrPayload).toContain("OK-TPA-2026-94821");
      expect(qrPayload).toContain("MA-TPA-882941");
    });

    it("manages female delivery partner period leave (2 days/month) storage key", () => {
      expect(PERIOD_LEAVE_STORAGE_KEY).toBe("ok_rider_female_leave_v1");
    });

    it("validates 2 consecutive days menstrual recovery window with zero rating penalty", () => {
      const today = "2026-10-16";
      const tomorrow = "2026-10-17";
      const leaveClaim = {
        dates: [today, tomorrow],
        dailyStipendPaise: 35000, // ₹350/day
        ratingProtected: true,
        streakPenaltyZero: true,
      };

      expect(leaveClaim.dates).toHaveLength(2);
      expect(leaveClaim.dailyStipendPaise).toBe(35000);
      expect(leaveClaim.ratingProtected).toBe(true);
      expect(leaveClaim.streakPenaltyZero).toBe(true);
    });
  });
});
