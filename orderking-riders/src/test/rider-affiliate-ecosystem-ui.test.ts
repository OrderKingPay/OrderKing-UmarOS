import { describe, it, expect } from "vitest";
import {
  TRUST_TIER_CONFIGS,
  getTrustTier,
  getTrustTierProgression,
  getPoliteFloatingCashMessage,
  RIDER_AFFILIATE_PARTNERS,
} from "../lib/rider/affiliate-ecosystem";

describe("OrderKing Rider App: Benefits Hub & Polite Dynamic Floating Cash", () => {
  describe("1. Dynamic Trust Tier Limits", () => {
    it("scales cash holding limits across operational tiers (₹2,000 to ₹5,000)", () => {
      expect(TRUST_TIER_CONFIGS.BRONZE.floatingCashLimitInr).toBe(2000);
      expect(TRUST_TIER_CONFIGS.SILVER.floatingCashLimitInr).toBe(2500);
      expect(TRUST_TIER_CONFIGS.GOLD.floatingCashLimitInr).toBe(3500);
      expect(TRUST_TIER_CONFIGS.DIAMOND.floatingCashLimitInr).toBe(5000);
    });

    it("evaluates trust tier correctly from lifetime delivery count", () => {
      expect(getTrustTier(0).tier).toBe("BRONZE");
      expect(getTrustTier(45).tier).toBe("BRONZE");
      expect(getTrustTier(50).tier).toBe("SILVER");
      expect(getTrustTier(199).tier).toBe("SILVER");
      expect(getTrustTier(200).tier).toBe("GOLD");
      expect(getTrustTier(499).tier).toBe("GOLD");
      expect(getTrustTier(500).tier).toBe("DIAMOND");
      expect(getTrustTier(1500).tier).toBe("DIAMOND");
    });

    it("calculates accurate tier progression metrics for the rider UI", () => {
      const prog = getTrustTierProgression(30);
      expect(prog.currentTier.tier).toBe("BRONZE");
      expect(prog.nextTier?.tier).toBe("SILVER");
      expect(prog.deliveriesCompleted).toBe(30);
      expect(prog.deliveriesNeededForNextTier).toBe(20);
      expect(prog.progressPercentage).toBe(60);
      expect(prog.nextHeadroomBonusInr).toBe(500);

      const diamond = getTrustTierProgression(750);
      expect(diamond.currentTier.tier).toBe("DIAMOND");
      expect(diamond.nextTier).toBeNull();
      expect(diamond.progressPercentage).toBe(100);
    });
  });

  describe("2. Polite Human-Style Messaging Engine", () => {
    const PUNITIVE_WORDS = [
      "theft",
      "fraud",
      "suspect",
      "criminal",
      "defaulter",
      "cheat",
      "punish",
      "blacklisted",
    ];

    function verifyNoPunitiveLanguage(text: string) {
      const lower = text.toLowerCase();
      for (const word of PUNITIVE_WORDS) {
        expect(lower).not.toContain(word);
      }
    }

    it("generates encouraging, polite message when cash balance is safe", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 50000, // ₹500
        lifetimeDeliveries: 10,
        riderName: "Rahul Sharma",
      });

      expect(msg.tone).toBe("COMFORTABLE");
      expect(msg.badgeTone).toBe("online");
      expect(msg.headroomInr).toBe(1500);
      expect(msg.headline).toContain("Rahul");
      expect(msg.prepaidOrdersUninterruptedNotice).toContain("active");
      verifyNoPunitiveLanguage(msg.headline + " " + msg.greetingAndStatus + " " + msg.suggestedAction);
    });

    it("generates warm advisory when cash balance reaches 75% soft warning", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 160000, // ₹1,600 / ₹2,000 = 80%
        lifetimeDeliveries: 20,
        riderName: "Sanjay",
      });

      expect(msg.tone).toBe("SOFT_WARNING");
      expect(msg.headroomInr).toBe(400);
      expect(msg.chaiBreakEncouragement).toContain("RO water");
      verifyNoPunitiveLanguage(msg.headline + " " + msg.greetingAndStatus + " " + msg.suggestedAction);
    });

    it("generates tea-break focused empathic message when 100% limit is reached", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 200000, // ₹2,000 / ₹2,000 = 100%
        lifetimeDeliveries: 15,
        riderName: "Amit Patel",
      });

      expect(msg.tone).toBe("LIMIT_REACHED");
      expect(msg.badgeTone).toBe("busy");
      expect(msg.headline).toContain("Incredible hustle today, Amit!");
      expect(msg.suggestedAction).toContain("tea break");
      expect(msg.chaiBreakEncouragement).toContain("Chai break time");
      expect(msg.prepaidOrdersUninterruptedNotice).toContain(
        "Prepaid online deliveries remain 100% active and unpaused",
      );
      expect(msg.upiIntentUrl).toContain("upi://pay");
      expect(msg.qrCodeUrl).toContain("api.qrserver.com");
      verifyNoPunitiveLanguage(msg.headline + " " + msg.greetingAndStatus + " " + msg.suggestedAction);
    });

    it("generates valid NPCI UPI intent URI and QR Code parameters", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 120000, // ₹1,200
        lifetimeDeliveries: 60, // Silver Partner (₹2,500 limit)
        vpa: "orderking.treasury@okaxis",
      });

      expect(msg.holdingLimitInr).toBe(2500);
      expect(msg.trustTierTitle).toBe("Silver Partner");
      expect(msg.upiIntentUrl).toContain("pa=orderking.treasury%40okaxis");
      expect(msg.upiIntentUrl).toContain("pn=OrderKing%20Treasury");
      expect(msg.upiIntentUrl).toContain("cu=INR");
    });
  });

  describe("3. Rider Benefits & Affiliate Partner Catalog", () => {
    it("includes Yulu, Zypp, and Battery Smart with 15% discount and promo codes", () => {
      const evs = RIDER_AFFILIATE_PARTNERS.evPartners;
      expect(evs).toHaveLength(3);

      const yulu = evs.find((e) => e.id === "yulu");
      expect(yulu?.discount).toContain("15%");
      expect(yulu?.promoCode).toBe("OKYULU15");
      expect(yulu?.deepLink).toContain("yulu.bike");

      const zypp = evs.find((e) => e.id === "zypp");
      expect(zypp?.discount).toContain("15%");
      expect(zypp?.promoCode).toBe("OKZYPP15");

      const smart = evs.find((e) => e.id === "battery_smart");
      expect(smart?.discount).toContain("15%");
      expect(smart?.promoCode).toBe("OKSMART15");
    });

    it("includes HPCL and IOCL petrocards offering ₹2.50/L cashback", () => {
      const fuels = RIDER_AFFILIATE_PARTNERS.fuelPartners;
      expect(fuels).toHaveLength(2);

      const hpcl = fuels.find((f) => f.id === "hpcl");
      expect(hpcl?.discount).toBe("₹2.50 / Liter Direct Cashback");

      const iocl = fuels.find((f) => f.id === "iocl");
      expect(iocl?.discount).toBe("₹2.50 / Liter Direct Cashback");
    });

    it("verifies Code on Social Security 2020 compliance with ₹10 Lakh accidental cover & OPD", () => {
      const ins = RIDER_AFFILIATE_PARTNERS.insurance;
      expect(ins.statute).toContain("Code on Social Security, 2020");
      expect(ins.accidentalDeathCover).toContain("10,00,000");
      expect(ins.opdHealthCard).toContain("₹5/week");
      expect(ins.opdPartners).toContain("MediBuddy");
    });

    it("specifies Instant Cashout with ₹10 flat fee and scheduled Wednesday payout at ₹0", () => {
      const cashout = RIDER_AFFILIATE_PARTNERS.instantCashout;
      expect(cashout.convenienceFee).toContain("₹10");
      expect(cashout.scheduledSettlement).toContain("₹0 Free");
      expect(cashout.scheduledSettlement).toContain("Wednesday 14:00 IST");
    });

    it("lists designated rest points with free purified water and charging docks", () => {
      const hubs = RIDER_AFFILIATE_PARTNERS.restPoints;
      expect(hubs.length).toBeGreaterThanOrEqual(3);
      for (const hub of hubs) {
        expect(hub.amenities.some((a) => a.toLowerCase().includes("water"))).toBe(true);
        expect(hub.amenities.some((a) => a.toLowerCase().includes("charging"))).toBe(true);
      }
    });
  });
});
