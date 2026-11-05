import { describe, it, expect } from "vitest";
import { en } from "../lib/i18n/en";
import { bn } from "../lib/i18n/bn";
import { platformConfig } from "../lib/platform-config";
import { INDIAN_LANGUAGE_CATALOG } from "../lib/i18n";
import { INDIAN_CONSTITUTIONAL_LANGUAGES } from "../routes/assistant";

describe("i18n Localization & Copy Quality Standards", () => {
  it("enforces brand name is 'Order King' (two words) with zero 'OrderKing' compound in English and Bengali", () => {
    function checkNoOrderKingCompound(obj: any, path = ""): void {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof v === "string") {
          expect(v).not.toMatch(/OrderKing(?![\w-]*\.(?:com|ts|tsx|js|json))/i);
        } else if (typeof v === "object" && v !== null) {
          checkNoOrderKingCompound(v, fullPath);
        }
      }
    }

    checkNoOrderKingCompound(en);
    checkNoOrderKingCompound(bn);
  });

  it("enforces AI branding is 'King AI' with zero 'Umar' or 'UmarOS' across all dictionaries", () => {
    function checkNoUmar(obj: any, path = ""): void {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof v === "string") {
          expect(v.toLowerCase()).not.toContain("umar");
          expect(v.toLowerCase()).not.toContain("umaros");
        } else if (typeof v === "object" && v !== null) {
          checkNoUmar(v, fullPath);
        }
      }
    }

    checkNoUmar(en);
    checkNoUmar(bn);

    expect(en.assistant.title).toContain("King AI");
    expect(en.assistant.placeholder).toContain("King AI");
    expect(en.assistant.send).toContain("King AI");
    expect(en.assistant.disclaimer).toContain("King AI");
    expect(en.nav.assistant).toBe("King AI");

    expect(bn.assistant.title).toContain("King AI");
    expect(bn.assistant.placeholder).toContain("King AI");
    expect(bn.assistant.send).toContain("King AI");
    expect(bn.assistant.disclaimer).toContain("King AI");
    expect(bn.nav.assistant).toBe("King AI");
  });

  it("verifies elimination of robotic and bureaucratic language", () => {
    const forbiddenRoboticPhrases = [
      "statutory compliance",
      "institutional merchant operations",
      "operations mode",
      "onboarding levies",
      "deploy your restaurant",
      "pure enterprise operations",
      "silent rejection is not allowed",
      "other authorised deduction",
      "prep performance",
    ];

    function checkNoRoboticPhrases(obj: any, path = ""): void {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof v === "string") {
          for (const phrase of forbiddenRoboticPhrases) {
            expect(v.toLowerCase()).not.toContain(phrase);
          }
        } else if (typeof v === "object" && v !== null) {
          checkNoRoboticPhrases(v, fullPath);
        }
      }
    }

    checkNoRoboticPhrases(en);

    // Bengali specific checks
    expect(bn.landing.forOwners).not.toContain("করিমগঞ্জ");
    expect(bn.orders.rejectHint).not.toContain("চুপচাপ প্রত্যাখ্যান করা যাবে না");
  });

  it("verifies Tier-1 legacy market leader document parity and commercial standard 28% commission", () => {
    expect(en.onboarding.gst).toContain("Optional");
    expect(en.onboarding.gst).toContain("20L");
    expect(en.onboarding.fssai).toContain("14 digits");
    expect(en.settlements.commission).toContain("28%");

    expect(bn.onboarding.gst).toContain("ঐচ্ছিক");
    expect(bn.onboarding.gst).toContain("২০");
    expect(bn.onboarding.fssai).toContain("১৪");
    expect(bn.settlements.commission).toContain("২৮%");
  });

  it("guarantees 100% key parity between English and Bengali dictionaries", () => {
    function collectKeys(obj: any, prefix = ""): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "object" && v !== null) {
          keys = keys.concat(collectKeys(v, full));
        } else {
          keys.push(full);
        }
      }
      return keys.sort();
    }

    const enKeys = collectKeys(en);
    const bnKeys = collectKeys(bn);

    expect(bnKeys).toEqual(enKeys);
  });

  it("enforces exactly 10 official benchmark languages in platformConfig.localization.supportedLanguages", () => {
    const expectedLanguages = ["en", "hi", "bn", "gu", "kn", "ml", "mr", "pa", "ta", "te"] as const;
    expect(platformConfig.localization.supportedLanguages).toEqual(expectedLanguages);
    expect(platformConfig.localization.supportedLanguages.length).toBe(10);
  });

  it("enforces exactly 10 official benchmark languages in INDIAN_LANGUAGE_CATALOG", () => {
    const expectedLanguages = ["en", "hi", "bn", "gu", "kn", "ml", "mr", "pa", "ta", "te"];
    expect(INDIAN_LANGUAGE_CATALOG.length).toBe(10);
    const catalogCodes = INDIAN_LANGUAGE_CATALOG.map((l) => l.code);
    expect(catalogCodes).toEqual(expectedLanguages);
  });

  it("verifies zero presence of removed mock, classical, or obscure languages", () => {
    const removedLanguageCodes = [
      "sa",
      "mai",
      "sat",
      "ks",
      "ne",
      "sd",
      "kok",
      "doi",
      "mni",
      "brx",
      "as",
      "or",
      "ur",
    ];

    const supported = platformConfig.localization.supportedLanguages as readonly string[];
    const catalogCodes = INDIAN_LANGUAGE_CATALOG.map((l) => l.code as string);
    const assistantCodes = INDIAN_CONSTITUTIONAL_LANGUAGES.map((l) => l.code);

    for (const code of removedLanguageCodes) {
      expect(supported).not.toContain(code);
      expect(catalogCodes).not.toContain(code);
      expect(assistantCodes).not.toContain(code);
    }
  });

  it("enforces exactly 10 official benchmark languages in assistant language selector", () => {
    const expectedLanguages = ["en", "hi", "bn", "gu", "kn", "ml", "mr", "pa", "ta", "te"];
    expect(INDIAN_CONSTITUTIONAL_LANGUAGES.length).toBe(10);
    const assistantCodes = INDIAN_CONSTITUTIONAL_LANGUAGES.map((l) => l.code);
    expect(assistantCodes).toEqual(expectedLanguages);
  });
});
