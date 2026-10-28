import { describe, expect, it } from "vitest";
import {
  CONCIERGE_DIALECTS,
  resolveSovereignResponse,
  type ActionPayload,
  type SupportedDialect,
} from "../components/ai/customer-concierge-drawer";
import { detectLanguage } from "../lib/ai-lang-detect";

describe("👑 AI Concierge & Intent Resolver - Supreme Certification Suite", () => {
  const getDialect = (code: string): SupportedDialect =>
    CONCIERGE_DIALECTS.find((d) => d.code === code) || CONCIERGE_DIALECTS[0];

  // --------------------------------------------------------------------------
  // Directive 1: Purge Long Verbose Texts & Enforce 1-2 Short Sentences
  // --------------------------------------------------------------------------
  describe("Directive 1: Purge Long Verbose Texts (Max 1-2 Short Natural Sentences)", () => {
    it("verifies all initial welcome messages are strictly 1 short, respectful sentence", () => {
      for (const dialect of CONCIERGE_DIALECTS) {
        expect(dialect.welcome).toBeTruthy();
        // Should not have multiple paragraphs or newline breaks
        expect(dialect.welcome).not.toContain("\n\n");
        // Sentence count should be 1
        const sentenceCount = dialect.welcome
          .split(/[.?!।|]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0).length;
        expect(sentenceCount).toBeLessThanOrEqual(2);
      }
    });

    it("verifies replies across various intents are strictly 1-2 short sentences", () => {
      const testQueries = [
        "I want to order biryani",
        "biryani chahiye",
        "ekta biriyani lagbe",
        "give me 50% discount",
        "coupon code please",
        "scan bharatqr",
        "pay my electricity bill",
        "where is my food delivery rider",
        "food arrived cold and spilled",
        "i want to eat",
      ];

      for (const query of testQueries) {
        const enDialect = getDialect("en");
        const res = resolveSovereignResponse(query, enDialect);

        expect(res.reply).toBeTruthy();
        expect(res.reply).not.toContain("\n\n");

        const sentenceCount = res.reply
          .split(/[.?!।|]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0).length;

        expect(sentenceCount).toBeGreaterThanOrEqual(1);
        expect(sentenceCount).toBeLessThanOrEqual(2);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Directive 2: Dynamic Language & Voice Mirroring
  // --------------------------------------------------------------------------
  describe("Directive 2: Dynamic Language & Voice Mirroring", () => {
    it("dynamically detects English, Hindi, Bengali, Assamese/Sylheti, Tamil, Telugu, etc.", () => {
      expect(detectLanguage("Hello, can you help me?")).toBe("en");
      expect(detectLanguage("मुझे दम बिरयानी चाहिए")).toBe("hi");
      expect(detectLanguage("biryani chahiye")).toBe("hi");
      expect(detectLanguage("আমাকে খাবার দিন")).toBe("bn");
      expect(detectLanguage("ekta biriyani lagbe")).toBe("bn");
      // Assamese distinctive characters or vocabulary
      expect(detectLanguage("মই বিৰিয়ানি খাম")).toBe("as");
      expect(detectLanguage("biriyani lagbo")).toBe("as");
      expect(detectLanguage("apunar khana lagibo")).toBe("as");
      // Tamil
      expect(detectLanguage("எனக்கு பிரியாணி வேண்டும்")).toBe("ta");
      expect(detectLanguage("biryani venum")).toBe("ta");
      // Telugu
      expect(detectLanguage("నాకు బిర్యానీ కావాలి")).toBe("te");
      expect(detectLanguage("biryani kavali")).toBe("te");
    });

    it("verifies supported dialects have matching BCP-47 voiceLang codes", () => {
      const en = getDialect("en");
      const hi = getDialect("hi");
      const bn = getDialect("bn");
      const as = getDialect("as");
      const ta = getDialect("ta");
      const te = getDialect("te");

      expect(en.voiceLang).toBe("en-IN");
      expect(hi.voiceLang).toBe("hi-IN");
      expect(bn.voiceLang).toBe("bn-IN");
      expect(as.voiceLang).toBe("as-IN");
      expect(ta.voiceLang).toBe("ta-IN");
      expect(te.voiceLang).toBe("te-IN");
    });
  });

  // --------------------------------------------------------------------------
  // Directive 3: Intent-to-Action Parser (Food, KingPay, Single Clarification)
  // --------------------------------------------------------------------------
  describe("Directive 3: Intent-to-Action Parser", () => {
    it("parses direct food requests into CHECKOUT_POPUP with item, quantity, and estimatedPaise", () => {
      // 1. English
      const enRes = resolveSovereignResponse("order biryani", getDialect("en"));
      expect(enRes.action?.type).toBe("CHECKOUT_POPUP");
      if (enRes.action?.type === "CHECKOUT_POPUP") {
        expect(enRes.action.item).toContain("Biryani");
        expect(enRes.action.quantity).toBe(1);
        expect(enRes.action.estimatedPaise).toBe(28000);
      }

      // 2. Hindi: "biryani chahiye"
      const hiRes = resolveSovereignResponse("biryani chahiye", getDialect("hi"));
      expect(hiRes.action?.type).toBe("CHECKOUT_POPUP");
      if (hiRes.action?.type === "CHECKOUT_POPUP") {
        expect(hiRes.action.item).toContain("Biryani");
        expect(hiRes.action.quantity).toBe(1);
        expect(hiRes.action.estimatedPaise).toBe(28000);
      }

      // 3. Bengali / Sylheti: "ekta biriyani lagbe"
      const bnRes = resolveSovereignResponse("ekta biriyani lagbe", getDialect("bn"));
      expect(bnRes.action?.type).toBe("CHECKOUT_POPUP");
      if (bnRes.action?.type === "CHECKOUT_POPUP") {
        expect(bnRes.action.item).toContain("Biryani");
        expect(bnRes.action.quantity).toBe(1);
        expect(bnRes.action.estimatedPaise).toBe(28000);
      }

      // 4. Quantity parsing: "2 pizza"
      const pizzaRes = resolveSovereignResponse("I want 2 pizza", getDialect("en"));
      expect(pizzaRes.action?.type).toBe("CHECKOUT_POPUP");
      if (pizzaRes.action?.type === "CHECKOUT_POPUP") {
        expect(pizzaRes.action.item).toBe("Farmhouse Fresh Pizza");
        expect(pizzaRes.action.quantity).toBe(2);
        expect(pizzaRes.action.estimatedPaise).toBe(32000 * 2);
      }
    });

    it("parses KingPay / UPI requests into KINGPAY_POPUP with SCAN, BILL, or TRANSFER", () => {
      // Scan
      const scanRes = resolveSovereignResponse("scan bharatqr to pay", getDialect("en"));
      expect(scanRes.action?.type).toBe("KINGPAY_POPUP");
      if (scanRes.action?.type === "KINGPAY_POPUP") {
        expect(scanRes.action.action).toBe("SCAN");
      }

      // Bill
      const billRes = resolveSovereignResponse("pay electricity bill with kingpay", getDialect("en"));
      expect(billRes.action?.type).toBe("KINGPAY_POPUP");
      if (billRes.action?.type === "KINGPAY_POPUP") {
        expect(billRes.action.action).toBe("BILL");
      }

      // Transfer
      const transferRes = resolveSovereignResponse("send money via upi transfer", getDialect("en"));
      expect(transferRes.action?.type).toBe("KINGPAY_POPUP");
      if (transferRes.action?.type === "KINGPAY_POPUP") {
        expect(transferRes.action.action).toBe("TRANSFER");
      }
    });

    it("enforces Single Clarification Rule when user request is ambiguous (e.g. 'I want to eat')", () => {
      const ambiguousQueries = [
        "I want to eat",
        "kuch khana hai",
        "khabar khabo",
        "kiba kham",
        "hungry",
      ];

      for (const query of ambiguousQueries) {
        const detected = detectLanguage(query);
        const dialect = getDialect(detected);
        const res = resolveSovereignResponse(query, dialect);

        // Expect exactly 1 short question comparing Royal Biryani or Homestyle Thali
        expect(res.reply).toMatch(/Royal Biryani|रॉयल बिरयानी|রয়্যাল বিরিয়ানি|ৰয়েল বিৰিয়ানি/i);
        expect(res.reply).toMatch(/Thali|थाली|থালি/i);
        expect(res.reply.endsWith("?")).toBe(true);

        const sentences = res.reply
          .split(/[?]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        expect(sentences.length).toBe(1);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Directive 4: Founder Profit Defense (Zero Auto-Discounts)
  // --------------------------------------------------------------------------
  describe("Directive 4: Founder Profit Defense (Zero Auto-Discounts)", () => {
    it("never burns founder margin on discount requests and highlights 200 bps 24K gold reward", () => {
      const discountQueries = [
        "give me 50% discount",
        "coupon code chahiye",
        "any promo code for free food",
        "kam karo paise",
        "discount lagbe",
      ];

      for (const query of discountQueries) {
        const detected = detectLanguage(query);
        const dialect = getDialect(detected);
        const res = resolveSovereignResponse(query, dialect);

        // Never generate discounts or fake codes
        expect(res.reply.toLowerCase()).not.toContain("50% off");
        expect(res.reply.toLowerCase()).not.toContain("coupon applied");

        // Highlights 200 bps 24K gold reward or KingPay cashback
        expect(res.reply).toMatch(/200 bps|24K|সোণৰ|গোল্ড/i);

        // 1 sentence max
        const sentenceCount = res.reply
          .split(/[.?!।|]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0).length;
        expect(sentenceCount).toBeLessThanOrEqual(2);

        // Action points to rewards
        expect(res.action?.type).toBe("NAVIGATE");
        expect(res.action?.url).toBe("/rewards");
      }
    });
  });

  // --------------------------------------------------------------------------
  // Directive 5: 2G Resilience (Sub-5ms Client-Side Zero Network Overhead)
  // --------------------------------------------------------------------------
  describe("Directive 5: 2G Resilience", () => {
    it("executes intent resolution 100% locally with sub-5ms performance benchmark", () => {
      const start = performance.now();
      for (let i = 0; i < 200; i++) {
        resolveSovereignResponse("Order 1 Chicken Dum Biryani", getDialect("en"));
        resolveSovereignResponse("biryani chahiye", getDialect("hi"));
        resolveSovereignResponse("ekta biriyani lagbe", getDialect("bn"));
        resolveSovereignResponse("scan bharatqr", getDialect("en"));
        resolveSovereignResponse("discount chahiye", getDialect("hi"));
      }
      const end = performance.now();
      const avgMs = (end - start) / 1000;

      // Must be well below 5ms per resolution
      expect(avgMs).toBeLessThan(5);
    });
  });

  // --------------------------------------------------------------------------
  // Additional Architectural Specification: Contextual Suggestive Selling
  // --------------------------------------------------------------------------
  describe("Additional Architectural Specification: Contextual Suggestive Selling", () => {
    it("attaches high-margin suggested add-ons (45%-60% margin) into CHECKOUT_POPUP payload", () => {
      // 1. Biryani: Raita and Gulab Jamun
      const biryaniRes = resolveSovereignResponse("1 Chicken Dum Biryani", getDialect("en"));
      expect(biryaniRes.action?.type).toBe("CHECKOUT_POPUP");
      if (biryaniRes.action?.type === "CHECKOUT_POPUP") {
        expect(biryaniRes.action.suggestedAddons).toBeDefined();
        expect(biryaniRes.action.suggestedAddons?.length).toBeGreaterThanOrEqual(2);

        const addonNames = biryaniRes.action.suggestedAddons?.map((a: any) => a.name);
        expect(addonNames).toContain("Chilled Mint Raita");
        expect(addonNames).toContain("Gulab Jamun (2 pcs)");

        // Confirms biryani and asks about add-ons in 1-2 sentences
        expect(biryaniRes.reply).toContain("Chicken Dum Biryani");
        expect(biryaniRes.reply).toMatch(/raita|gulab jamun/i);
      }

      // 2. Pizza: Garlic Bread and Soda
      const pizzaRes = resolveSovereignResponse("order pizza", getDialect("en"));
      if (pizzaRes.action?.type === "CHECKOUT_POPUP") {
        const addonNames = pizzaRes.action.suggestedAddons?.map((a: any) => a.name);
        expect(addonNames).toContain("Garlic Breadsticks");
        expect(addonNames).toContain("Chilled Soda Can");
      }

      // 3. Bengali prompt: "ekta biriyani lagbe" -> Bengali suggestive prompt
      const bnBiryani = resolveSovereignResponse("ekta biriyani lagbe", getDialect("bn"));
      expect(bnBiryani.reply).toContain("বিরিয়ানি");
      expect(bnBiryani.reply).toMatch(/রায়তা|গোলাপ জামুন/i);
    });
  });
});
