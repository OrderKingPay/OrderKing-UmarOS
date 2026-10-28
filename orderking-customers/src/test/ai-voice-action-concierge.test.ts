/**
 * 👑 ZERO-DEFECT QUALITY GATE: AI VOICE ACTION CONCIERGE TEST SUITE
 * orderking-customers/src/test/ai-voice-action-concierge.test.ts
 *
 * Council Directive & Specialization Gate:
 * Supreme Code Integrity Auditor (a57bc3d7)
 * Statutory Entity: OrderKing / KingPay (GSTIN: 18AFXPH9838M1Z9)
 *
 * Mandatory Verification Matrix:
 * 1. Max 1-2 sentence brevity across English, Hindi, Bengali, Assamese/Sylheti.
 * 2. Dynamic language detection and automatic voice mirroring.
 * 3. Intent-to-action parsing: CHECKOUT_POPUP and KINGPAY_POPUP.
 * 4. Founder profit defense: zero discount leak when user asks for coupons/discounts.
 * 5. Single clarifying question behavior on ambiguous inputs.
 * 6. Integer paise precision and zero floating-point math leaks.
 */

import { describe, it, expect } from "vitest";
import {
  processVoiceActionConcierge,
  detectConciergeLanguage,
  countSentences,
  type VoiceConciergeResponse,
  type CheckoutPopupPayload,
  type KingPayPopupPayload,
} from "../lib/ai/voice-action-concierge.ts";

describe("AI Voice Action Concierge Zero-Defect Audit Suite", () => {
  /* =====================================================================
     1. BREVITY AUDIT: MAX 1-2 SENTENCE LIMIT ACROSS 4 REGIONAL LANGUAGES
     ===================================================================== */
  describe("1. Brevity Verification (Strict Max 1-2 Sentences)", () => {
    it("enforces max 2 sentences for English voice responses", () => {
      const queries = [
        "Order 2 chicken biryani right now",
        "Open KingPay to scan merchant QR",
        "Give me a 50% discount coupon",
        "I am hungry and need food",
        "Hello assistant what can you do",
        "Can you help me pay my electricity bill",
        "I want to order 3 pizzas for a party tonight",
      ];

      for (const q of queries) {
        const res = processVoiceActionConcierge(q);
        expect(res.sentenceCount).toBeGreaterThanOrEqual(1);
        expect(res.sentenceCount).toBeLessThanOrEqual(2);
        expect(countSentences(res.text)).toBeLessThanOrEqual(2);
      }
    });

    it("enforces max 2 sentences for Hindi voice responses (with danda ।)", () => {
      const queries = [
        "दो प्लेट चिकन बिरयानी ऑर्डर करो",
        "बिजली बिल भरना है किंगपे खोलो",
        "कोई कूपन कोड या डिस्काउंट दो",
        "भूख लगी है कुछ खाना है",
        "नमस्ते मुझे सहायता चाहिए",
        "एक प्लेट मोमो पैक कर दो",
        "क्या मुझे फ्री डिलीवरी मिल सकती है",
      ];

      for (const q of queries) {
        const res = processVoiceActionConcierge(q);
        expect(res.sentenceCount).toBeGreaterThanOrEqual(1);
        expect(res.sentenceCount).toBeLessThanOrEqual(2);
        expect(countSentences(res.text)).toBeLessThanOrEqual(2);
      }
    });

    it("enforces max 2 sentences for Bengali voice responses (with danda ।)", () => {
      const queries = [
        "দুটো চিকেন দম বিরিয়ানি প্যাক করো",
        "কিংপে কিউআর কোড স্ক্যানার খোলো",
        "কোনো ছাড় বা ডিসকাউন্ট কুপন আছে কি",
        "খাবার চাই কি খাবো",
        "নমস্কার আপনার সেবা কি",
        "৩ প্লেট কাচ্চি বিরিয়ানি বানাও",
        "টাকা রিফান্ড কবে পাবো",
      ];

      for (const q of queries) {
        const res = processVoiceActionConcierge(q);
        expect(res.sentenceCount).toBeGreaterThanOrEqual(1);
        expect(res.sentenceCount).toBeLessThanOrEqual(2);
        expect(countSentences(res.text)).toBeLessThanOrEqual(2);
      }
    });

    it("enforces max 2 sentences for Assamese & Sylheti voice responses", () => {
      const queries = [
        "কিতা খবর বিরিয়ানি লাগবো দেও",
        "দেরি অইতাছে খাবার কনে আইলো না",
        "ট্যাকা কম করো ডিসকাউন্ট লাগবো",
        "খাবার কনে",
        "নমস্কাৰ সহায় কৰক",
        "আমাক এতিয়া এখন মাছৰ থালী দিয়ক",
      ];

      for (const q of queries) {
        const res = processVoiceActionConcierge(q);
        expect(res.sentenceCount).toBeGreaterThanOrEqual(1);
        expect(res.sentenceCount).toBeLessThanOrEqual(2);
        expect(countSentences(res.text)).toBeLessThanOrEqual(2);
      }
    });
  });

  /* =====================================================================
     2. DYNAMIC LANGUAGE DETECTION & AUTOMATIC VOICE LOCALE MIRRORING
     ===================================================================== */
  describe("2. Dynamic Language Detection & Voice Mirroring", () => {
    it("correctly detects English and mirrors en-IN voice locale", () => {
      const res = detectConciergeLanguage("Order 1 chicken burger for delivery");
      expect(res.language).toBe("en");
      expect(res.voiceLocale).toBe("en-IN");
    });

    it("correctly detects Hindi (Devanagari script) and mirrors hi-IN voice locale", () => {
      const res = detectConciergeLanguage("मुझे 2 प्लेट मोमो चाहिए");
      expect(res.language).toBe("hi");
      expect(res.voiceLocale).toBe("hi-IN");
    });

    it("correctly detects Hindi (Romanized transliteration) and mirrors hi-IN voice locale", () => {
      const res = detectConciergeLanguage("bhai ek plate biryani pack kardo");
      expect(res.language).toBe("hi");
      expect(res.voiceLocale).toBe("hi-IN");
    });

    it("correctly detects Bengali and mirrors bn-IN voice locale", () => {
      const res = detectConciergeLanguage("দুটো মাটন বিরিয়ানি অর্ডার করো");
      expect(res.language).toBe("bn");
      expect(res.voiceLocale).toBe("bn-IN");
    });

    it("correctly detects Sylheti / Assamese dialect markers and mirrors as-IN voice locale", () => {
      // Sylheti dialect marker: কিতা খবর
      const resSyl = detectConciergeLanguage("কিতা খবর একটা বিৰিয়ানি দেও");
      expect(resSyl.language).toBe("syl_as");
      expect(resSyl.voiceLocale).toBe("as-IN");

      // Sylheti dialect marker: খাবার কনে
      const resKone = detectConciergeLanguage("খাবার কনে আইল না");
      expect(resKone.language).toBe("syl_as");
      expect(resKone.voiceLocale).toBe("as-IN");

      // Sylheti dialect marker: দেরি অইতাছে
      const resDeri = detectConciergeLanguage("দেরি অইতাছে খাবার আইলো না ক্যনে");
      expect(resDeri.language).toBe("syl_as");
      expect(resDeri.voiceLocale).toBe("as-IN");

      // Assamese marker: নমস্কাৰ
      const resAs = detectConciergeLanguage("নমস্কাৰ মোৰ খাদ্য লাগে");
      expect(resAs.language).toBe("syl_as");
      expect(resAs.voiceLocale).toBe("as-IN");
    });
  });

  /* =====================================================================
     3. INTENT-TO-ACTION PARSING: CHECKOUT_POPUP & KINGPAY_POPUP
     ===================================================================== */
  describe("3. Intent-to-Action Parsing Audit", () => {
    it("correctly parses food ordering intent into CHECKOUT_POPUP with itemized parameters", () => {
      const res = processVoiceActionConcierge("Order 2 Royal Chicken Dum Biryani");

      expect(res.action).toBe("CHECKOUT_POPUP");
      expect(res.payload).toBeDefined();

      const payload = res.payload as CheckoutPopupPayload;
      expect(payload.action).toBe("CHECKOUT_POPUP");
      expect(payload.dish).toContain("Biryani");
      expect(payload.quantity).toBe(2);
      expect(payload.unitPricePaise).toBe(28000); // ₹280.00
      expect(payload.packagingPaise).toBe(3000); // ₹30.00 CCPA cap compliant
      // Subtotal: 56000 + 3000 = 59000. 5% CGST = 2950
      expect(payload.foodGstPaise).toBe(2950);
      expect(payload.totalPricePaise).toBe(61950); // ₹619.50 in SafeInteger paise
      expect(payload.currency).toBe("INR");
      expect(payload.discountPaise).toBe(0);
    });

    it("correctly parses regional Bengali ordering into CHECKOUT_POPUP with quantity", () => {
      const res = processVoiceActionConcierge("২ প্লেট মোমো প্যাক করো");

      expect(res.action).toBe("CHECKOUT_POPUP");
      const payload = res.payload as CheckoutPopupPayload;
      expect(payload.dish).toContain("Momos");
      expect(payload.quantity).toBe(2);
      expect(payload.unitPricePaise).toBe(14000); // ₹140.00
      expect(payload.totalPricePaise).toBeGreaterThan(payload.unitPricePaise * 2);
    });

    it("correctly parses Hindi ordering into CHECKOUT_POPUP with quantity word 'दो'", () => {
      const res = processVoiceActionConcierge("दो प्लेट बिरयानी भेजो");

      expect(res.action).toBe("CHECKOUT_POPUP");
      const payload = res.payload as CheckoutPopupPayload;
      expect(payload.dish).toContain("Biryani");
      expect(payload.quantity).toBe(2);
    });

    it("correctly parses KingPay scanner intent into KINGPAY_POPUP with routing VPA", () => {
      const res = processVoiceActionConcierge("Open KingPay to scan UPI QR");

      expect(res.action).toBe("KINGPAY_POPUP");
      expect(res.payload).toBeDefined();

      const payload = res.payload as KingPayPopupPayload;
      expect(payload.action).toBe("KINGPAY_POPUP");
      expect(payload.subAction).toBe("SCAN_QR");
      expect(payload.routingVpa).toBe("orderking@ybl");
    });

    it("correctly parses electricity/utility bill intent into KINGPAY_POPUP", () => {
      const res = processVoiceActionConcierge("मुझे बिजली बिल भरना है");

      expect(res.action).toBe("KINGPAY_POPUP");
      const payload = res.payload as KingPayPopupPayload;
      expect(payload.subAction).toBe("PAY_BILL");
    });

    it("correctly extracts integer payment amount for KingPay UPI payments", () => {
      const res = processVoiceActionConcierge("Pay ₹500 via UPI");

      expect(res.action).toBe("KINGPAY_POPUP");
      const payload = res.payload as KingPayPopupPayload;
      expect(payload.amountPaise).toBe(50000); // ₹500.00 = 50000 paise
      expect(Number.isInteger(payload.amountPaise)).toBe(true);
    });
  });

  /* =====================================================================
     4. FOUNDER PROFIT DEFENSE: ZERO DISCOUNT LEAK AUDIT
     ===================================================================== */
  describe("4. Founder Profit Defense (Zero Discount Leak)", () => {
    it("blocks coupon/discount leaks and sets profitDefended=true on discount requests", () => {
      const discountQueries = [
        "Can I get a 50% discount coupon?",
        "kuch discount milega kya bhai",
        "kono coupon code ba offer ache ni",
        "promo code apply karo",
        "give me free biryani",
        "ট্যাকা কম করো ডিসকাউন্ট দেও",
        "mujhe 100 rupaye ki chhoot chahiye",
        "discount lagbe",
      ];

      for (const q of discountQueries) {
        const res = processVoiceActionConcierge(q);

        // Invariant: Must defend platform profits
        expect(res.profitDefended).toBe(true);
        expect(res.action).toBe("GENERAL_ASSIST");

        // Must NOT output a checkout payload with a discount
        if (res.payload && "discountPaise" in res.payload) {
          expect(res.payload.discountPaise).toBe(0);
        }

        // Brevity: 1 to 2 sentences
        expect(res.sentenceCount).toBeLessThanOrEqual(2);

        // Verification of honest pricing statement
        expect(res.text.length).toBeGreaterThan(10);
      }
    });

    it("provides polite, firm explanation in the customer's native language without leaking margins", () => {
      const resEn = processVoiceActionConcierge("Is there any discount coupon?");
      expect(resEn.text).toContain("direct restaurant kitchen net rates");

      const resHi = processVoiceActionConcierge("कोई डिस्काउंट कूपन मिलेगा क्या?");
      expect(resHi.text).toContain("रेस्टोरेंट की असली नेट दरें");

      const resBn = processVoiceActionConcierge("কোনো ডিসকাউন্ট বা ছাড় আছে কি?");
      expect(resBn.text).toContain("রান্নাঘরের আসল মূল্যে");
    });
  });

  /* =====================================================================
     5. SINGLE CLARIFYING QUESTION BEHAVIOR ON AMBIGUOUS INPUTS
     ===================================================================== */
  describe("5. Single Clarifying Question Behavior on Ambiguous Inputs", () => {
    it("responds with exactly 1 clarifying question when food intent is ambiguous", () => {
      const ambiguousQueries = [
        "food",
        "hungry",
        "kuch khana hai",
        "khabar lagbe",
        "order food",
        "bhookh lagi hai",
      ];

      for (const q of ambiguousQueries) {
        const res = processVoiceActionConcierge(q);

        expect(res.action).toBe("CLARIFICATION");
        expect(res.payload).toEqual({
          action: "CLARIFICATION",
          context: "FOOD_SELECTION",
        });

        // INVARIANT: Strictly 1 single clarifying question, never rambling
        expect(res.sentenceCount).toBe(1);
        expect(res.text).toContain("?");
      }
    });

    it("asks the clarifying question in the customer's detected regional dialect", () => {
      const resHi = processVoiceActionConcierge("kuch khana hai");
      expect(resHi.language).toBe("hi");
      expect(resHi.text).toContain("क्या आप");

      const resBn = processVoiceActionConcierge("khabar lagbe");
      expect(resBn.language).toBe("bn");
      expect(resBn.text).toContain("আপনি কি");

      const resEn = processVoiceActionConcierge("hungry");
      expect(resEn.language).toBe("en");
      expect(resEn.text).toContain("Would you prefer");
    });
  });

  /* =====================================================================
     6. INTEGER PAISE PRECISION & ZERO FLOATING-POINT MATH LEAKS
     ===================================================================== */
  describe("6. Integer Paise Precision & Zero Float Leaks", () => {
    it("guarantees 100% integer SafeInteger paise across all generated payloads", () => {
      const orders = [
        "Order 1 biryani",
        "Order 2 biryani",
        "Order 3 momos",
        "Order 5 burgers",
        "Order 4 farmhouse pizza",
        "Order 7 kadak masala chai",
      ];

      for (const ord of orders) {
        const res = processVoiceActionConcierge(ord);
        expect(res.action).toBe("CHECKOUT_POPUP");

        const p = res.payload as CheckoutPopupPayload;

        // Strict integer assertions (no 0.1 float drift)
        expect(Number.isInteger(p.unitPricePaise)).toBe(true);
        expect(Number.isInteger(p.packagingPaise)).toBe(true);
        expect(Number.isInteger(p.foodGstPaise)).toBe(true);
        expect(Number.isInteger(p.totalPricePaise)).toBe(true);
        expect(Number.isInteger(p.quantity)).toBe(true);
        expect(p.discountPaise).toBe(0);

        // Mathematical sum balance assertion:
        const expectedTaxable = p.unitPricePaise * p.quantity + p.packagingPaise;
        const expectedGst = Math.round((expectedTaxable * 500) / 10000);
        expect(p.foodGstPaise).toBe(expectedGst);
        expect(p.totalPricePaise).toBe(expectedTaxable + expectedGst);
      }
    });

    it("guarantees integer paise for KingPay amounts with zero decimals", () => {
      const paymentQueries = [
        "Pay ₹100 via UPI",
        "Pay ₹250 for food",
        "Pay ₹1299 for flights",
        "Pay ₹4999 via KingPay",
      ];

      for (const q of paymentQueries) {
        const res = processVoiceActionConcierge(q);
        expect(res.action).toBe("KINGPAY_POPUP");
        const p = res.payload as KingPayPopupPayload;
        expect(p.amountPaise).toBeDefined();
        expect(Number.isInteger(p.amountPaise!)).toBe(true);
        expect(p.amountPaise! % 100).toBe(0); // Exact whole rupees in paise
      }
    });
  });
});
