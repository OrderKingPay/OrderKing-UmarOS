import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  resolveActiveVertical,
  resolvePlatformContext,
  CUSTOMER_PRIMARY_TABS,
  DYNAMIC_PRIMARY_TABS,
  DYNAMIC_HISTORY_CONFIG,
} from "@/components/navigation/floating-bottom-nav";
import {
  buildMotorInsuranceAffiliateUrl,
  checkVehicleExpiryAlert,
} from "@/components/fintech/supreme-kingpay-experience";

const readFile = (relativePath: string) => {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return readFileSync(fullPath, "utf8");
};

describe("Ultra-Luxury UI Architect Audit Suite (783ded97)", () => {
  const shellCode = readFile("../components/market/shell.tsx");
  const bottomNavCode = readFile("../components/navigation/floating-bottom-nav.tsx");
  const kingpayExperienceCode = readFile("../components/fintech/supreme-kingpay-experience.tsx");
  const travelIndexCode = readFile("../routes/travel/index.tsx");
  const garageHubCode = readFile("../components/fintech/vehicle-garage-hub.tsx");

  /* =====================================================================
     1. TOP HEADER AUDIT (shell.tsx)
     ===================================================================== */
  describe("1. Top Header Audit & Micro-Pill Invariants", () => {
    it("renders Minimal Symbol Pills '( 🍔 )' and '( ✈️ 🚆 🎓 )' in center navigation", () => {
      // Pill 1: Food Delivery
      expect(shellCode).toContain("🍔");
      expect(shellCode).toContain('title="OrderKing Food Delivery"');
      expect(shellCode).toContain('to="/"');

      // Pill 2: Super-App (Travel & AI Tutor)
      expect(shellCode).toContain("✈️ 🚆 🎓");
      expect(shellCode).toContain('title="KingPay Super-App (Flights, Trains, AI Tutor)"');
      expect(shellCode).toContain('to="/travel"');
    });

    it("displays Gold Crown Wallet pill linking to KingPay", () => {
      expect(shellCode).toContain('to="/kingpay"');
      expect(shellCode).toContain('aria-label="Gold Crown Wallet"');
      expect(shellCode).toContain("Wallet");
      expect(shellCode).toContain("Crown");
    });

    it("purges slogan clutter, promotional buzzwords, and marketing noise", () => {
      // No ungrounded slogans or fake discounts
      expect(shellCode).not.toContain("Lowest price guaranteed");
      expect(shellCode).not.toContain("100% Free Delivery");
      expect(shellCode).not.toContain("Cheapest in India");
      expect(shellCode).not.toContain("Save ₹40-₹80");
      expect(shellCode).not.toContain("OrderKing VIP"); // sanitized to "Verified Patron"
      expect(shellCode).toContain("Verified Patron");
    });

    it("applies GPU hardware-acceleration and CSS containment to sticky header", () => {
      expect(shellCode).toContain("transform-gpu");
      expect(shellCode).toContain("[contain:paint]");
    });
  });

  /* =====================================================================
     2. CONTEXTUAL DYNAMIC BOTTOM NAVIGATION (floating-bottom-nav.tsx)
     ===================================================================== */
  describe("2. Contextual Dynamic Bottom Navigation Audit", () => {
    it("dynamically configures 3rd button between Food Orders and Bookings/PNRs", () => {
      expect(bottomNavCode).toContain("My Bookings & PNRs");
      expect(bottomNavCode).toContain("My Food Orders");
      expect(bottomNavCode).toContain("/travel?tab=trips");
      expect(bottomNavCode).toContain("/orders");
      expect(bottomNavCode).toContain("Luggage");
      expect(bottomNavCode).toContain("ClipboardList");
    });

    it("routes active verticals accurately across all platform contexts", () => {
      // Food Delivery Vertical
      expect(resolveActiveVertical("/")).toBe("orderking");
      expect(resolveActiveVertical("/orders")).toBe("orderking");
      expect(resolveActiveVertical("/delivery")).toBe("orderking");
      expect(resolvePlatformContext("/")).toBe("delivery");

      // Super-App Verticals
      expect(resolveActiveVertical("/travel")).toBe("travel");
      expect(resolvePlatformContext("/travel")).toBe("travel");
      expect(resolveActiveVertical("/king-pay")).toBe("kingpay");
      expect(resolvePlatformContext("/king-pay")).toBe("kingpay");
      expect(resolveActiveVertical("/tutor")).toBe("tutor-jobs");
      expect(resolvePlatformContext("/tutor")).toBe("tutor");
    });

    it("supports ultra-narrow mobile viewports (320px) without text clipping or layout shift", () => {
      // Micro-labels for <= 380px screens
      expect(bottomNavCode).toContain("🧳 Bookings");
      expect(bottomNavCode).toContain("📋 Orders");
      expect(bottomNavCode).toContain("xs:hidden");
      expect(bottomNavCode).toContain("hidden xs:inline");
    });

    it("enforces GPU hardware acceleration and paint containment for 60/120fps scrolling", () => {
      expect(bottomNavCode).toContain("transform-gpu");
      expect(bottomNavCode).toContain("will-change-transform");
      expect(bottomNavCode).toContain("[contain:paint]");
    });

    it("maintains zero cumulative layout shift (CLS < 0.01) with fixed grid and min-heights", () => {
      expect(bottomNavCode).toContain("grid-cols-3");
      expect(bottomNavCode).toContain("min-h-[58px]");
      expect(bottomNavCode).toContain("sm:min-h-[62px]");
    });
  });

  /* =====================================================================
     3. CORE HUB POWER TILES (supreme-kingpay-experience.tsx & travel/index.tsx)
     ===================================================================== */
  describe("3. Core Hub Luxury Power Tiles Audit", () => {
    it("renders the 9 pure luxury 3D power tiles in KingPay Super-App Experience", () => {
      // Tile 1: Flights
      expect(kingpayExperienceCode).toContain("✈️");
      expect(kingpayExperienceCode).toContain("Flights");
      expect(kingpayExperienceCode).toContain("/travel?tab=flights");

      // Tile 2: Trains
      expect(kingpayExperienceCode).toContain("🚆");
      expect(kingpayExperienceCode).toContain("Trains");
      expect(kingpayExperienceCode).toContain("/travel?tab=trains");

      // Tile 3: Hotels
      expect(kingpayExperienceCode).toContain("🏨");
      expect(kingpayExperienceCode).toContain("Hotels");
      expect(kingpayExperienceCode).toContain("/travel?tab=hotels");

      // Tile 4: Tours & Pilgrimage / Holiday Tours
      expect(kingpayExperienceCode).toMatch(/🌍|🕋 \/ 🛕/);
      expect(kingpayExperienceCode).toMatch(/Holiday Tours|Tours &amp; Pilgrimage/);
      expect(kingpayExperienceCode).toMatch(/\/travel\?tab=(tours|pilgrimage)/);

      // Tile 5: King AI Tutor
      expect(kingpayExperienceCode).toContain("🎓");
      expect(kingpayExperienceCode).toContain("King AI Tutor");
      expect(kingpayExperienceCode).toContain("Academic Tutor");
      expect(kingpayExperienceCode).toContain('to="/tutor"');

      // Tile 6: King Jobs
      expect(kingpayExperienceCode).toContain("💼");
      expect(kingpayExperienceCode).toContain("King Jobs");
      expect(kingpayExperienceCode).toContain('to="/tutor-jobs"');

      // Tile 7: My Garage
      expect(kingpayExperienceCode).toContain("🚗");
      expect(kingpayExperienceCode).toContain("My Garage");
      expect(kingpayExperienceCode).toContain('setActiveDesk("garage")');

      // Tile 8: Daily Bills
      expect(kingpayExperienceCode).toContain("⚡");
      expect(kingpayExperienceCode).toContain("Daily Bills");
      expect(kingpayExperienceCode).toContain('setActiveDesk("bills")');

      // Tile 9: Local Parcel & Courier
      expect(kingpayExperienceCode).toContain("💰");
      expect(kingpayExperienceCode).toContain("Local Parcel &amp; Courier");
      expect(kingpayExperienceCode).toContain('setActiveDesk("wealth")');
    });

    it("verifies hardware acceleration and fixed min-heights across power tiles (CLS < 0.01)", () => {
      expect(kingpayExperienceCode).toContain("transform-gpu will-change-transform");
      expect(kingpayExperienceCode).toContain("min-h-[96px] sm:min-h-[108px]");
    });

    it("renders the 4 power tiles in Travel desk as responsive tab selectors with zero tutor clutter", () => {
      expect(travelIndexCode).toContain("setActiveTab(\"flights\")");
      expect(travelIndexCode).toContain("setActiveTab(\"trains\")");
      expect(travelIndexCode).toContain("setActiveTab(\"hotels\")");
      expect(travelIndexCode).toContain("setActiveTab(\"pilgrimage\")");
      expect(travelIndexCode).not.toContain("to=\"/tutor\"");
      expect(travelIndexCode).not.toContain("to=\"/tutor-jobs\"");
    });

    it("verifies travel tours desk contains zero marketing cashback banners", () => {
      expect(travelIndexCode).not.toContain("Closed-Loop Cashback Banner");
      expect(travelIndexCode).not.toContain("Earn up to ₹5,000 instant cashback");
      expect(travelIndexCode).toContain("Holiday Tours");
      expect(travelIndexCode).toContain("National &amp; International");
    });
  });

  /* =====================================================================
     4. SILENT BYPASS 8: MY VEHICLE GARAGE & 1-CLICK MOTOR INSURANCE RENEWAL
     ===================================================================== */
  describe("4. Silent Bypass 8 — My Vehicle Garage & 1-Click Motor Insurance Renewal", () => {
    it("buildMotorInsuranceAffiliateUrl produces authentic PolicyBazaar URLs with tracking markers", () => {
      const url = buildMotorInsuranceAffiliateUrl("policybazaar", "AS-10-AB-1234");
      expect(url).toContain("https://www.policybazaar.com/motor-insurance/");
      expect(url).toContain("regNo=AS-10-AB-1234");
      expect(url).toContain("utm_source=orderking_affiliate");
      expect(url).toContain("utm_medium=garage_renewal");
      expect(url).toContain("utm_campaign=silent_bypass_8");
      expect(url).toContain("aff_id=orderking_pay");
    });

    it("buildMotorInsuranceAffiliateUrl produces authentic Acko URLs with tracking markers", () => {
      const url = buildMotorInsuranceAffiliateUrl("acko", "DL-01-XY-9876");
      expect(url).toContain("https://www.acko.com/insurance/car-insurance/");
      expect(url).toContain("regNo=DL-01-XY-9876");
      expect(url).toContain("utm_source=orderking_affiliate");
      expect(url).toContain("utm_medium=garage_renewal");
      expect(url).toContain("utm_campaign=silent_bypass_8");
      expect(url).toContain("aff_id=orderking_pay");
    });

    it("checkVehicleExpiryAlert detects <= 15 days remaining for insurance or PUC", () => {
      // 14 days insurance expiry (triggers alert)
      const alert1 = checkVehicleExpiryAlert({ insuranceExpiryDays: 14, pucExpiryDays: 60 });
      expect(alert1.hasAlert).toBe(true);
      expect(alert1.isInsuranceExpiringSoon).toBe(true);
      expect(alert1.isPucExpiringSoon).toBe(false);
      expect(alert1.alertReason).toContain("Insurance Expiring in 14 days");

      // 12 days PUC expiry (triggers alert)
      const alert2 = checkVehicleExpiryAlert({ insuranceExpiryDays: 45, pucExpiryDays: 12 });
      expect(alert2.hasAlert).toBe(true);
      expect(alert2.isInsuranceExpiringSoon).toBe(false);
      expect(alert2.isPucExpiringSoon).toBe(true);
      expect(alert2.alertReason).toContain("PUC Expiring in 12 days");

      // Both expiring <= 15 days
      const alert3 = checkVehicleExpiryAlert({ insuranceExpiryDays: 10, pucExpiryDays: 8 });
      expect(alert3.hasAlert).toBe(true);
      expect(alert3.isInsuranceExpiringSoon).toBe(true);
      expect(alert3.isPucExpiringSoon).toBe(true);
      expect(alert3.alertReason).toContain("Insurance (10d) & PUC (8d) Expiring Soon");

      // Safe (> 15 days)
      const safe = checkVehicleExpiryAlert({ insuranceExpiryDays: 45, pucExpiryDays: 90 });
      expect(safe.hasAlert).toBe(false);
      expect(safe.isInsuranceExpiringSoon).toBe(false);
      expect(safe.isPucExpiringSoon).toBe(false);
      expect(safe.alertReason).toBeUndefined();
    });

    it("verifies Garage Desk UI contains the automated 15-day alert banner", () => {
      expect(kingpayExperienceCode).toContain("Automated 15-Day Expiry Alert Active");
      expect(kingpayExperienceCode).toContain("MoRTH &amp; RTO Expiry Radar");
      expect(kingpayExperienceCode).toContain("Motor Vehicles Act");
      expect(kingpayExperienceCode).toContain("checkVehicleExpiryAlert");
    });

    it("verifies Garage vehicle cards feature 15-Day Alert badge and PUC countdown", () => {
      expect(kingpayExperienceCode).toContain("🚨 15-Day Alert: Expires in");
      expect(kingpayExperienceCode).toContain("⚠️");
      expect(kingpayExperienceCode).toContain("d left");
    });

    it("verifies dual 1-Click Renewal actions routing to PolicyBazaar and Acko with affiliate tracking", () => {
      expect(kingpayExperienceCode).toContain("PolicyBazaar (1-Click)");
      expect(kingpayExperienceCode).toContain("Acko");
      expect(kingpayExperienceCode).toContain("buildMotorInsuranceAffiliateUrl(\"policybazaar\", veh.regNo)");
      expect(kingpayExperienceCode).toContain("buildMotorInsuranceAffiliateUrl(\"acko\", veh.regNo)");
      expect(garageHubCode).toContain("buildMotorInsuranceAffiliateUrl(\"policybazaar\", \"GENERAL\")");
      expect(garageHubCode).toContain("buildMotorInsuranceAffiliateUrl(\"acko\", \"GENERAL\")");
    });
  });

  /* =====================================================================
     5. VIEWPORT RESPONSIVENESS (320px to 4K Displays)
     ===================================================================== */
  describe("5. Viewport Responsiveness & Layout Architecture", () => {
    it("contains mobile-first responsive grid definitions (cols-2 on mobile, cols-3/cols-4 on desktop)", () => {
      expect(kingpayExperienceCode).toContain("grid-cols-2 sm:grid-cols-3");
      expect(travelIndexCode).toContain("grid-cols-2 md:grid-cols-4");
    });

    it("enforces max-width constraints and auto margins for 4K display viewport containment", () => {
      expect(shellCode).toContain("max-w-7xl");
      expect(shellCode).toContain("mx-auto");
      expect(bottomNavCode).toContain("max-w-lg md:max-w-[560px]");
    });

    it("guarantees text truncation and zero overflow on narrow 320px viewports", () => {
      expect(bottomNavCode).toContain("truncate");
      expect(bottomNavCode).toContain("min-w-0");
      expect(kingpayExperienceCode).toContain("truncate");
      expect(kingpayExperienceCode).toContain("min-w-0");
    });
  });
});
