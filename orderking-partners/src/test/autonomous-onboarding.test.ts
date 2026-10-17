import { describe, it, expect } from "vitest";
import {
  verifyFSSAI,
  verifyGSTIN,
  digitizeMenuFromOcr,
  parseDishLine,
  inferDiet,
  autonomousMerchantOnboard,
  INDIAN_STATE_CODES,
} from "../lib/server/autonomous-onboarding";

describe("Autonomous Merchant Onboarding & Menu Digitizer", () => {
  describe("FSSAI 14-Digit Automated Verification", () => {
    it("validates compliant 14-digit FSSAI numbers successfully", async () => {
      // Test known active mock registry license
      const resActive = await verifyFSSAI("10020011000123");
      expect(resActive.isValid).toBe(true);
      expect(resActive.status).toBe("ACTIVE");
      expect(resActive.licenseNumber).toBe("10020011000123");
      expect(resActive.tradeName).toBe("Royal Biryani House");

      // Test standard valid 14-digit state registration
      const resAssam = await verifyFSSAI("20021018000456");
      expect(resAssam.isValid).toBe(true);
      expect(resAssam.registrationType).toBe("REGISTRATION");

      // Test algorithmic verification for any arbitrary compliant 14-digit number
      const resGen = await verifyFSSAI("11223344556677");
      expect(resGen.isValid).toBe(true);
      expect(resGen.status).toBe("ACTIVE");
    });

    it("rejects non-compliant FSSAI numbers with bad format or length", async () => {
      // Too short
      const resShort = await verifyFSSAI("1234567890123");
      expect(resShort.isValid).toBe(false);
      expect(resShort.status).toBe("INVALID");
      expect(resShort.failureReason).toContain("must be exactly 14 digits");

      // Too long
      const resLong = await verifyFSSAI("123456789012345");
      expect(resLong.isValid).toBe(false);
      expect(resLong.status).toBe("INVALID");

      // Non-numeric characters
      const resAlpha = await verifyFSSAI("1002001100012A");
      expect(resAlpha.isValid).toBe(false);
      expect(resAlpha.status).toBe("INVALID");

      // Empty
      const resEmpty = await verifyFSSAI("");
      expect(resEmpty.isValid).toBe(false);
    });

    it("catches expired FSSAI licenses from mock registry", async () => {
      const resExpired = await verifyFSSAI("10019011000999");
      expect(resExpired.isValid).toBe(false);
      expect(resExpired.status).toBe("EXPIRED");
      expect(resExpired.failureReason).toContain("expired");
    });
  });

  describe("GSTIN 15-Character Automated Verification", () => {
    it("validates standard 15-character GSTIN format and extracts state and PAN", async () => {
      // Known active mock registry GSTIN
      const resAssam = await verifyGSTIN("18AABCR1234F1Z5");
      expect(resAssam.isValid).toBe(true);
      expect(resAssam.status).toBe("ACTIVE");
      expect(resAssam.stateCode).toBe("18");
      expect(resAssam.stateName).toBe("Assam");
      expect(resAssam.pan).toBe("AABCR1234F");
      expect(resAssam.tradeName).toBe("Royal Biryani House");

      // Delhi GSTIN
      const resDelhi = await verifyGSTIN("07AAAAA0000A1Z5");
      expect(resDelhi.isValid).toBe(true);
      expect(resDelhi.stateCode).toBe("07");
      expect(resDelhi.stateName).toBe("Delhi");
    });

    it("rejects invalid GSTIN strings", async () => {
      // Too short
      const resShort = await verifyGSTIN("18AABCR1234F");
      expect(resShort.isValid).toBe(false);
      expect(resShort.status).toBe("INVALID");

      // Invalid characters / structure (missing 'Z' at position 14)
      const resBad = await verifyGSTIN("18AABCR1234F1A5");
      expect(resBad.isValid).toBe(false);
      expect(resBad.failureReason).toContain("does not match standard 15-character GST pattern");

      // Random text
      const resRandom = await verifyGSTIN("NOT_A_GSTIN");
      expect(resRandom.isValid).toBe(false);
    });

    it("detects cancelled GSTIN registrations from registry", async () => {
      const resCancelled = await verifyGSTIN("27AABCT9999P1Z8");
      expect(resCancelled.isValid).toBe(false);
      expect(resCancelled.status).toBe("CANCELLED");
      expect(resCancelled.failureReason).toContain("cancelled");
    });
  });

  describe("OCR / Text Menu Digitizer", () => {
    it("infers dietary tags accurately from names and tags", () => {
      expect(inferDiet("Tandoori Chicken Tikka")).toBe("NONVEG");
      expect(inferDiet("Paneer Butter Masala")).toBe("VEG");
      expect(inferDiet("Boiled Egg Curry [E]")).toBe("EGG");
      expect(inferDiet("Mutton Rogan Josh [NV]")).toBe("NONVEG");
      expect(inferDiet("Yellow Dal Tadka (V)")).toBe("VEG");
      expect(inferDiet("Soya Chaap Vegan Curry")).toBe("VEGAN");
    });

    it("parses single dish lines into structured items with integer paise", () => {
      const item1 = parseDishLine("Paneer Butter Masala - ₹240", "Main");
      expect(item1).not.toBeNull();
      expect(item1?.name).toBe("Paneer Butter Masala");
      expect(item1?.pricePaise).toBe(24000); // ₹240 = 24,000 paise
      expect(item1?.diet).toBe("VEG");
      expect(item1?.category).toBe("Main");

      const item2 = parseDishLine("Butter Naan 40", "Breads");
      expect(item2).not.toBeNull();
      expect(item2?.name).toBe("Butter Naan");
      expect(item2?.pricePaise).toBe(4000); // ₹40 = 4,000 paise
      expect(item2?.category).toBe("Breads");

      const item3 = parseDishLine(
        "Chicken Biryani (Spicy, served with raita) 350 [NV]",
        "Main"
      );
      expect(item3).not.toBeNull();
      expect(item3?.name).toBe("Chicken Biryani");
      expect(item3?.description).toBe("Spicy, served with raita");
      expect(item3?.pricePaise).toBe(35000); // ₹350 = 35,000 paise
      expect(item3?.diet).toBe("NONVEG");

      const item4 = parseDishLine("Gulab Jamun (2 pcs) 80 (V)", "Desserts");
      expect(item4).not.toBeNull();
      expect(item4?.pricePaise).toBe(8000); // ₹80 = 8,000 paise
      expect(item4?.category).toBe("Desserts");
      expect(item4?.diet).toBe("VEG");
    });

    it("digitizes multi-section raw menu text with full categorization", () => {
      const sampleMenuOcr = `
*** STARTERS ***
Veg Spring Rolls - ₹180
Chicken Seekh Kebab [NV] 280/-
Paneer Malai Tikka (Melt in mouth cottage cheese) 220

*** MAIN COURSE ***
Dal Makhani - 210
Butter Chicken (Authentic Old Delhi Recipe) - ₹360 [NV]
Egg Curry (Homestyle preparation) 240 (E)

*** BREADS ***
Tandoori Roti - ₹25
Garlic Naan - ₹55
Lachha Paratha 45

*** DESSERTS ***
Gulab Jamun 80
Rasmalai (2 pieces) 120 (V)

*** BEVERAGES ***
Masala Chai - ₹40
Sweet Lassi 60
      `;

      const result = digitizeMenuFromOcr(sampleMenuOcr);
      expect(result.categories.length).toBeGreaterThanOrEqual(4);
      expect(result.totalDishesCount).toBe(13);
      expect(result.nonVegDishesCount).toBeGreaterThanOrEqual(2);
      expect(result.eggDishesCount).toBe(1);
      expect(result.vegDishesCount).toBeGreaterThanOrEqual(8);

      const starters = result.categories.find((c) => c.name === "Starters");
      expect(starters).toBeDefined();
      expect(starters?.items.length).toBe(3);

      const mainCourse = result.categories.find((c) => c.name === "Main");
      expect(mainCourse).toBeDefined();
      expect(mainCourse?.items.length).toBe(3);

      const breads = result.categories.find((c) => c.name === "Breads");
      expect(breads).toBeDefined();
      expect(breads?.items.length).toBe(3);

      const desserts = result.categories.find((c) => c.name === "Desserts");
      expect(desserts).toBeDefined();
      expect(desserts?.items.length).toBe(2);

      // Verify all items have integer paise
      for (const cat of result.categories) {
        for (const it of cat.items) {
          expect(Number.isInteger(it.pricePaise)).toBe(true);
          expect(it.pricePaise).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("End-to-End Autonomous Merchant Onboarding", () => {
    it("successfully onboards compliant merchant with zero human operators", async () => {
      const input = {
        merchantName: "Royal Biryani House",
        tradeName: "Royal Biryani House",
        contactEmail: "admin@royalbiryani.in",
        contactPhone: "9876543210",
        address: "GS Road, Christian Basti, Guwahati, Assam",
        stateCode: "18",
        fssaiNumber: "10020011000123",
        gstin: "18AABCR1234F1Z5",
        rawMenuOcrText: `
*** MAIN COURSE ***
Hyderabadi Chicken Dum Biryani (Fragrant basmati rice with marinated chicken) ₹320 [NV]
Paneer Handi Biryani ₹260 (V)
Mirchi Ka Salan 90
        `,
      };

      const onboardResult = await autonomousMerchantOnboard(input);
      expect(onboardResult.status).toBe("ONBOARDED_ACTIVE");
      expect(onboardResult.compliancePassed).toBe(true);
      expect(onboardResult.zeroHumanOnboarded).toBe(true);
      expect(onboardResult.verification.fssai.isValid).toBe(true);
      expect(onboardResult.verification.gstin.isValid).toBe(true);
      expect(onboardResult.digitizedMenu).toBeDefined();
      expect(onboardResult.digitizedMenu?.totalDishesCount).toBe(3);
      expect(onboardResult.auditTrail.length).toBe(4);
    });

    it("rejects non-compliant merchant when FSSAI or GSTIN is invalid", async () => {
      const input = {
        merchantName: "Fraudulent Kitchen",
        contactEmail: "bad@kitchen.com",
        contactPhone: "9000000000",
        address: "Unknown Location",
        stateCode: "27",
        fssaiNumber: "123", // Invalid length
        gstin: "27AABCT9999P1Z8", // Cancelled GSTIN
        rawMenuOcrText: "Paneer Butter Masala 200",
      };

      const onboardResult = await autonomousMerchantOnboard(input);
      expect(onboardResult.status).toBe("REJECTED_COMPLIANCE");
      expect(onboardResult.compliancePassed).toBe(false);
      expect(onboardResult.rejectionReasons?.length).toBe(2);
      expect(onboardResult.auditTrail.some((a) => a.status === "FAILED")).toBe(true);
    });
  });
});
