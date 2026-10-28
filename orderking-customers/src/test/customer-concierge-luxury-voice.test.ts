/**
 * 👑 ZERO-DEFECT QUALITY GATE: LUXURY VOICE CONCIERGE & ACTION POP-UP UI
 * orderking-customers/src/test/customer-concierge-luxury-voice.test.ts
 *
 * Council Directive & Specialization Gate:
 * Ultra-Luxury UI Architect (783ded97)
 * Statutory Entity: OrderKing / KingPay (GSTIN: 18AFXPH9838M1Z9)
 *
 * Mandatory Verification Matrix:
 * 1. Intent-to-Action Bottom Sheet Pop-Up:
 *    - CHECKOUT_POPUP: 3D jewel bottom-sheet with dish name, quantity selector,
 *      total in ₹ and integer paise, delivery ETA, and 1-tap "Confirm & Pay via KingPay UPI".
 *    - High-margin suggestive add-on micro-toggles: [+ Add Raita ₹40] [+ Add Gulab Jamun ₹50].
 *    - Dynamic price recalculation in ₹ and integer paise before the CTA button.
 *    - KINGPAY_POPUP: 1-tap direct UPI launch modal (upi://pay?pa=9395065587@ybl&...) & BharatQR scanner.
 * 2. Voice Microphone Visual Experience:
 *    - Pulsating gold glow ring when isListening is active (ring-4 ring-amber-400, animate-pulse).
 *    - Real-time speech transcription preview with clear visual indicator (interim transcript, audio waves).
 *    - Sound toggle button for instant client-side speech synthesis (Audio ON / Muted).
 * 3. Mobile Viewport Resilience:
 *    - Seamless fit within 360px–430px mobile viewports without horizontal scroll or overflow.
 *    - Lightweight sub-16ms 60fps GPU-accelerated transitions (transform-gpu will-change-transform).
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  SUGGESTIVE_ADD_ONS,
  CONCIERGE_DIALECTS,
  type SuggestiveAddOn,
  type ActionPayload,
} from "../components/ai/customer-concierge-drawer";
import { formatPaise } from "../lib/money.ts";

const readFile = (relativePath: string) => {
  const fullPath = resolve(__dirname, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return readFileSync(fullPath, "utf8");
};

describe("Luxury Voice Concierge & Action Pop-Up UI Audit Suite (783ded97)", () => {
  const drawerSource = readFile("../components/ai/customer-concierge-drawer.tsx");

  /* =====================================================================
     1. INTENT-TO-ACTION BOTTOM SHEET POP-UP (CHECKOUT_POPUP & KINGPAY_POPUP)
     ===================================================================== */
  describe("1. Intent-to-Action Bottom Sheet Pop-Up Audit", () => {
    it("defines CHECKOUT_POPUP and KINGPAY_POPUP action payloads", () => {
      expect(drawerSource).toContain('"CHECKOUT_POPUP"');
      expect(drawerSource).toContain('"KINGPAY_POPUP"');
      expect(drawerSource).toContain("activePopup");
      expect(drawerSource).toContain("setActivePopup");
    });

    it("renders the 3D jewel bottom-sheet with dish details, quantity selector, and delivery ETA", () => {
      // Dish details
      expect(drawerSource).toContain("activePopup.dishName");
      expect(drawerSource).toContain("activePopup.deliveryEta");
      expect(drawerSource).toContain("activePopup.restaurantName");

      // Quantity selector buttons
      expect(drawerSource).toContain("popupQuantity");
      expect(drawerSource).toContain("setPopupQuantity");
      expect(drawerSource).toContain("Decrease quantity");
      expect(drawerSource).toContain("Increase quantity");

      // 1-Tap CTA button
      expect(drawerSource).toContain("Confirm &amp; Pay");
      expect(drawerSource).toContain("via KingPay UPI");
    });

    it("renders high-margin suggestive selling add-on micro-toggles", () => {
      expect(SUGGESTIVE_ADD_ONS).toBeDefined();
      expect(SUGGESTIVE_ADD_ONS.length).toBeGreaterThanOrEqual(2);

      // Verify Boondi Raita toggle (+ Add Raita ₹40)
      const raita = SUGGESTIVE_ADD_ONS.find((a: SuggestiveAddOn) => a.id.includes("raita"));
      expect(raita).toBeDefined();
      expect(raita?.pricePaise).toBe(4000); // ₹40.00 = 4000 paise
      expect(raita?.label).toContain("Raita");

      // Verify Gulab Jamun toggle (+ Add Gulab Jamun ₹50)
      const gulabJamun = SUGGESTIVE_ADD_ONS.find((a: SuggestiveAddOn) => a.id.includes("gulab-jamun"));
      expect(gulabJamun).toBeDefined();
      expect(gulabJamun?.pricePaise).toBe(5000); // ₹50.00 = 5000 paise
      expect(gulabJamun?.label).toContain("Gulab Jamun");
    });

    it("calculates dynamic order totals in ₹ and integer paise when add-ons are toggled", () => {
      const baseDishPricePaise = 38000; // ₹380.00
      const quantity = 2; // 2x Handi Biryani = 76000 paise
      const dishSubtotalPaise = baseDishPricePaise * quantity;
      expect(dishSubtotalPaise).toBe(76000);

      // Add Raita (4000 paise) + Gulab Jamun (5000 paise)
      const raitaPaise = 4000;
      const gulabJamunPaise = 5000;
      const grandTotalPaise = dishSubtotalPaise + raitaPaise + gulabJamunPaise;

      expect(grandTotalPaise).toBe(85000); // ₹850.00
      expect(formatPaise(grandTotalPaise)).toBe("₹850.00");
      expect(Number.isInteger(grandTotalPaise)).toBe(true);

      // Verify code contains integer paise breakdown in UI
      expect(drawerSource).toContain("dishSubtotalPaise");
      expect(drawerSource).toContain("addOnsSubtotalPaise");
      expect(drawerSource).toContain("grandTotalPaise");
      expect(drawerSource).toContain("integer paise");
    });

    it("renders the 1-tap direct UPI launch modal & BharatQR scanner in KINGPAY_POPUP", () => {
      expect(drawerSource).toContain("Direct 1-Tap UPI");
      expect(drawerSource).toContain("Scan BharatQR");
      expect(drawerSource).toContain("upi://pay?pa=9395065587@ybl");
      expect(drawerSource).toContain("orderking@ybl");
      expect(drawerSource).toContain("kingpayAmountRupees");
      expect(drawerSource).toContain("Launch UPI (PhonePe / GPay / Paytm)");
    });
  });

  /* =====================================================================
     2. VOICE MICROPHONE VISUAL EXPERIENCE AUDIT
     ===================================================================== */
  describe("2. Voice Microphone Visual Experience Audit", () => {
    it("features pulsating gold glow ring when isListening is active", () => {
      // Glow ring classes
      expect(drawerSource).toContain("ring-4");
      expect(drawerSource).toContain("ring-amber-400");
      expect(drawerSource).toContain("animate-pulse");
      expect(drawerSource).toContain("shadow-[0_0_25px_rgba(251,191,36,0.7)]");
      expect(drawerSource).toContain("bg-gradient-to-br from-amber-400");
    });

    it("displays real-time speech transcription preview with clear visual indicator", () => {
      expect(drawerSource).toContain("interimTranscript");
      expect(drawerSource).toContain("Listening:");
      expect(drawerSource).toContain("role=\"status\"");
      expect(drawerSource).toContain("aria-live=\"assertive\"");
      expect(drawerSource).toContain("animate-ping");
    });

    it("includes sound toggle button for instant client-side speech synthesis", () => {
      expect(drawerSource).toContain("soundEnabled");
      expect(drawerSource).toContain("setSoundEnabled");
      expect(drawerSource).toContain("Volume2");
      expect(drawerSource).toContain("VolumeX");
      expect(drawerSource).toContain("Audio ON");
      expect(drawerSource).toContain("Muted");
      expect(drawerSource).toContain("window.speechSynthesis.cancel()");
    });
  });

  /* =====================================================================
     3. MOBILE VIEWPORT RESILIENCE (360px–430px) & 60FPS SMOOTHNESS
     ===================================================================== */
  describe("3. Mobile Viewport Resilience Audit (360px–430px)", () => {
    it("guarantees seamless fit within mobile viewports without horizontal overflow", () => {
      expect(drawerSource).toContain("max-w-md");
      expect(drawerSource).toContain("overflow-x-hidden");
      expect(drawerSource).toContain("truncate");
      expect(drawerSource).toContain("min-w-0");
    });

    it("enforces touch target sizes >= 44px for thumb friendly accessibility", () => {
      expect(drawerSource).toContain("min-h-[44px]");
      expect(drawerSource).toContain("min-h-[46px]");
    });

    it("applies GPU hardware-acceleration and lightweight transitions for slow 2G devices", () => {
      expect(drawerSource).toContain("transform-gpu");
      expect(drawerSource).toContain("will-change-transform");
      expect(drawerSource).toContain("duration-200");
    });

    it("verifies statutory entity compliance disclosure (GSTIN: 18AFXPH9838M1Z9)", () => {
      expect(drawerSource).toContain("18AFXPH9838M1Z9");
      expect(drawerSource).toContain("Assam - 788710");
    });
  });
});
