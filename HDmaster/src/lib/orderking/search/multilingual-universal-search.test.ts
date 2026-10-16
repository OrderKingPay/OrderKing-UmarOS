import { describe, expect, it } from "vitest";
import {
  createMultilingualSearchEngine,
  detectLocale,
  indicToRomanPhonetic,
  levenshteinDistance,
  phoneticNormalize,
  stringSimilarity,
  universalSearchEngine,
  PLATFORM_DOMAINS,
  DEFAULT_INDEX_ITEMS,
  type PlatformDomainId,
  type SearchResultCategory,
  type SearchIndexItem,
} from "./multilingual-universal-search";

describe("Multilingual Universal Search & Control Center", () => {
  // ==========================================================================
  // 1. PLATFORM DOMAINS & CATEGORIES COVERAGE
  // ==========================================================================
  describe("12 Platform Domains Indexing & Coverage", () => {
    it("indexes and verifies all 12 platform domains in registry", () => {
      const expectedDomains: PlatformDomainId[] = [
        "umaros",
        "customer_app",
        "partner_app",
        "rider_app",
        "kingpay",
        "api_integrations",
        "affiliate_referral",
        "marketing_crm",
        "umar_ai",
        "finance_bizops",
        "geo_management",
        "infra_security",
      ];

      expect(PLATFORM_DOMAINS).toHaveLength(12);
      const registeredDomainIds = PLATFORM_DOMAINS.map((d) => d.id);
      for (const domain of expectedDomains) {
        expect(registeredDomainIds).toContain(domain);
      }

      // Check default items contain items for every single domain
      const stats = universalSearchEngine.getStats();
      expect(stats.totalItems).toBeGreaterThanOrEqual(25);
      for (const domain of expectedDomains) {
        expect(stats.itemsByDomain[domain]).toBeGreaterThan(0);
      }
    });

    it("indexes items across all operational categories", () => {
      const stats = universalSearchEngine.getStats();
      const categories: SearchResultCategory[] = [
        "domain",
        "setting",
        "feature_switch",
        "business_parameter",
        "dictionary_key",
        "action",
      ];

      for (const cat of categories) {
        expect(stats.itemsByCategory[cat]).toBeGreaterThan(0);
      }
    });

    it("provides complete metadata and deep-links for all 12 platform domains", () => {
      for (const domain of PLATFORM_DOMAINS) {
        expect(domain.name.en).toBeTruthy();
        expect(domain.name.hi).toBeTruthy();
        expect(domain.name.bn).toBeTruthy();
        expect(domain.name.as).toBeTruthy();
        expect(domain.defaultRoute.startsWith("/")).toBe(true);
        expect(domain.deepLink.includes("://")).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 2. MULTILINGUAL SUPPORT (EN, HI, BN, AS) & SCRIPT DETECTION
  // ==========================================================================
  describe("Multilingual Detection & Localization", () => {
    it("accurately detects scripts for English, Hindi, Bengali, and Assamese", () => {
      expect(detectLocale("payout settlement")).toBe("en");
      expect(detectLocale("भुगतान")).toBe("hi");
      expect(detectLocale("पार्टनर ऐप")).toBe("hi");
      expect(detectLocale("পেমেন্ট")).toBe("bn");
      expect(detectLocale("দোকানদার")).toBe("bn");
      // Assamese specific characters ৰ (09F0) and ৱ (09F1)
      expect(detectLocale("উপাৰ্জন")).toBe("as");
      expect(detectLocale("ব্যৱসায়ী")).toBe("as");
      expect(detectLocale("ৰাইডাৰ")).toBe("as");
      // Transliterated intent detection
      expect(detectLocale("bhugtan")).toBe("hi");
      expect(detectLocale("pement")).toBe("bn");
      expect(detectLocale("uparjan")).toBe("as");
    });

    it("returns localized titles and descriptions based on query language", () => {
      // Query in Hindi
      const hiRes = universalSearchEngine.search("डॉक स्थिति");
      expect(hiRes.detectedLocale).toBe("hi");
      expect(hiRes.topResults.length).toBeGreaterThan(0);
      expect(hiRes.topResults[0].title).toBe("डॉक स्थिति और विंडो व्यवहार");

      // Query in Bengali
      const bnRes = universalSearchEngine.search("ডক অবস্থান");
      expect(bnRes.detectedLocale).toBe("bn");
      expect(bnRes.topResults.length).toBeGreaterThan(0);
      expect(bnRes.topResults[0].title).toBe("ডক অবস্থান এবং উইন্ডো আচরণ");

      // Query in Assamese
      const asRes = universalSearchEngine.search("ডক অৱস্থান");
      expect(asRes.detectedLocale).toBe("as");
      expect(asRes.topResults.length).toBeGreaterThan(0);
      expect(asRes.topResults[0].title).toBe("ডক অৱস্থান আৰু উইণ্ডো ব্যৱহাৰ");
    });
  });

  // ==========================================================================
  // 3. CROSS-LINGUAL SYNONYMS DICTIONARY
  // ==========================================================================
  describe("Synonyms Dictionary & Cross-Lingual Bridges", () => {
    it("CRITICAL REQUIREMENT: 'payout' matches 'settlement', 'भुगतान', 'পেমেন্ট', 'উপাৰ্জন'", () => {
      const results = universalSearchEngine.search("payout");

      expect(results.totalMatches).toBeGreaterThan(0);
      const matchedIds = results.topResults.map((r) => r.id);

      // Must find KingPay payout/settlement
      expect(matchedIds).toContain("setting:kingpay:payout_settlement_rules");
      // Must find Rider instant earnings payout
      expect(matchedIds).toContain("setting:rider:instant_payout");
      // Must find Partner weekly settlement
      expect(matchedIds).toContain("setting:partner:weekly_payout");

      // Check that Hindi (भुगतान), Bengali (পেমেন্ট), and Assamese (উপাৰ্জন) matched
      const allReasons = results.topResults.flatMap((r) => r.matchReasons);
      const allTokens = results.topResults.flatMap((r) => r.matchedTokens);

      const hasSettlement = allTokens.some((t) => t.includes("settlement"));
      const hasBhugtan = allTokens.some((t) => t.includes("भुगतान") || t.includes("bhugtan"));
      const hasPement = allTokens.some((t) => t.includes("পেমেন্ট") || t.includes("pement"));
      const hasUparjan = allTokens.some((t) => t.includes("উপাৰ্জন") || t.includes("uparjan"));

      expect(hasSettlement).toBe(true);
      expect(hasBhugtan || allReasons.some((r) => r.includes("भुगतान"))).toBe(true);
      expect(hasPement || allReasons.some((r) => r.includes("পেমেন্ট"))).toBe(true);
      expect(hasUparjan || allReasons.some((r) => r.includes("উপাৰ্জন"))).toBe(true);
    });

    it("verifies bidirectional query from Hindi 'भुगतान' matches payout and settlement items", () => {
      const results = universalSearchEngine.search("भुगतान");
      expect(results.totalMatches).toBeGreaterThan(0);
      const matchedIds = results.topResults.map((r) => r.id);
      expect(matchedIds).toContain("setting:kingpay:payout_settlement_rules");
      expect(matchedIds).toContain("setting:rider:instant_payout");
    });

    it("verifies bidirectional query from Bengali 'পেমেন্ট' matches payout and settlement items", () => {
      const results = universalSearchEngine.search("পেমেন্ট");
      expect(results.totalMatches).toBeGreaterThan(0);
      const matchedIds = results.topResults.map((r) => r.id);
      expect(matchedIds).toContain("setting:kingpay:payout_settlement_rules");
    });

    it("verifies bidirectional query from Assamese 'উপাৰ্জন' matches payout and settlement items", () => {
      const results = universalSearchEngine.search("উপাৰ্জন");
      expect(results.totalMatches).toBeGreaterThan(0);
      const matchedIds = results.topResults.map((r) => r.id);
      expect(matchedIds).toContain("setting:rider:instant_payout");
      expect(matchedIds).toContain("setting:partner:weekly_payout");
    });

    it("matches emergency killswitches across 'killswitch', 'freeze', 'आपातकालीन', 'জরুরী', 'জৰুৰী'", () => {
      const q1 = universalSearchEngine.search("killswitch");
      const q2 = universalSearchEngine.search("आपातकालीन");
      const q3 = universalSearchEngine.search("জরুরী");
      const q4 = universalSearchEngine.search("জৰুৰী");

      const id = "switch:infra:global_emergency_freeze";
      expect(q1.topResults.map((r) => r.id)).toContain(id);
      expect(q2.topResults.map((r) => r.id)).toContain(id);
      expect(q3.topResults.map((r) => r.id)).toContain(id);
      expect(q4.topResults.map((r) => r.id)).toContain(id);
    });

    it("matches soundbox audio voice announcements across Hindi, Bengali, Assamese", () => {
      const qHindi = universalSearchEngine.search("ध्वनि");
      const qBengali = universalSearchEngine.search("শব্দ");
      const qAssamese = universalSearchEngine.search("মাত");

      const soundboxId = "setting:kingpay:soundbox_multilingual_voice";
      expect(qHindi.topResults.map((r) => r.id)).toContain(soundboxId);
      expect(qBengali.topResults.map((r) => r.id)).toContain(soundboxId);
      expect(qAssamese.topResults.map((r) => r.id)).toContain(soundboxId);
    });
  });

  // ==========================================================================
  // 4. PHONETIC NORMALIZATION & INDIC TRANSLITERATION
  // ==========================================================================
  describe("Phonetic Normalization & Indic Transliteration", () => {
    it("transliterates Devanagari and Bengali/Assamese characters to Roman phonetics", () => {
      expect(indicToRomanPhonetic("भुगतान")).toBe("bhugtan");
      expect(indicToRomanPhonetic("পেমেন্ট")).toBe("pement");
      expect(indicToRomanPhonetic("উপাৰ্জন")).toBe("uparjn");
      expect(indicToRomanPhonetic("সাউন্ড")).toBe("saund");
    });

    it("normalizes phonetics into standardized sound tokens", () => {
      // Double letters collapsed, labials and sibilants unified
      expect(phoneticNormalize("payout")).toBe("payout");
      expect(phoneticNormalize("payoout")).toBe("payut");
      expect(phoneticNormalize("settlement")).toBe("setlement");
      expect(phoneticNormalize("bhugtan")).toBe("bugtan");
      expect(phoneticNormalize("भुगतान")).toBe("bugtan");
    });

    it("matches romanized transliterations like 'bhugtan' and 'pement' to their target items", () => {
      const resBhugtan = universalSearchEngine.search("bhugtan");
      expect(resBhugtan.totalMatches).toBeGreaterThan(0);
      expect(resBhugtan.topResults.some((r) => r.id.includes("payout"))).toBe(true);

      const resPement = universalSearchEngine.search("pement");
      expect(resPement.totalMatches).toBeGreaterThan(0);
      expect(resPement.topResults.some((r) => r.id.includes("payout") || r.id.includes("kingpay"))).toBe(true);

      const resUparjan = universalSearchEngine.search("uparjan");
      expect(resUparjan.totalMatches).toBeGreaterThan(0);
      expect(resUparjan.topResults.some((r) => r.id.includes("rider") || r.id.includes("payout"))).toBe(true);
    });
  });

  // ==========================================================================
  // 5. FUZZY MATCHING & TYPO TOLERANCE
  // ==========================================================================
  describe("Fuzzy Matching & String Similarity", () => {
    it("calculates accurate Levenshtein distance and Damerau transpositions", () => {
      expect(levenshteinDistance("payout", "payout")).toBe(0);
      expect(levenshteinDistance("payout", "payoout")).toBe(1);
      expect(levenshteinDistance("settlement", "settlment")).toBe(1);
      expect(levenshteinDistance("settlement", "setlment")).toBe(2);
      // Transposition
      expect(levenshteinDistance("soundbox", "suondbox")).toBe(1);
      expect(stringSimilarity("payout", "payout")).toBe(1.0);
      expect(stringSimilarity("payout", "payot")).toBeGreaterThan(0.8);
    });

    it("successfully finds items when user makes typos", () => {
      // Typo in 'settlement' -> 'setlment'
      const typoRes1 = universalSearchEngine.search("setlment");
      expect(typoRes1.totalMatches).toBeGreaterThan(0);
      expect(typoRes1.topResults.some((r) => r.id.includes("settlement") || r.id.includes("payout"))).toBe(true);

      // Typo in 'soundbox' -> 'soundbx'
      const typoRes2 = universalSearchEngine.search("soundbx");
      expect(typoRes2.totalMatches).toBeGreaterThan(0);
      expect(typoRes2.topResults.some((r) => r.id.includes("soundbox"))).toBe(true);

      // Typo in 'commission' -> 'comision'
      const typoRes3 = universalSearchEngine.search("comision");
      expect(typoRes3.totalMatches).toBeGreaterThan(0);
      expect(typoRes3.topResults.some((r) => r.id.includes("commission") || r.id.includes("partner"))).toBe(true);
    });
  });

  // ==========================================================================
  // 6. GROUPED CATEGORICAL SEARCH RESULTS & ACTION NAVIGATION LINKS
  // ==========================================================================
  describe("Grouped Categorical Results & Direct Action Links", () => {
    it("groups search results by all 12 platform domains", () => {
      const res = universalSearchEngine.search("emergency");
      expect(res.resultsByDomain).toBeDefined();

      const expectedDomains: PlatformDomainId[] = [
        "umaros",
        "customer_app",
        "partner_app",
        "rider_app",
        "kingpay",
        "api_integrations",
        "affiliate_referral",
        "marketing_crm",
        "umar_ai",
        "finance_bizops",
        "geo_management",
        "infra_security",
      ];

      for (const domain of expectedDomains) {
        expect(Array.isArray(res.resultsByDomain[domain])).toBe(true);
      }

      // 'emergency' should appear in partner_app (snooze) and infra_security (killswitch)
      expect(res.resultsByDomain.infra_security.length).toBeGreaterThan(0);
      expect(res.resultsByDomain.partner_app.length).toBeGreaterThan(0);
    });

    it("groups search results by category", () => {
      const res = universalSearchEngine.search("payout");
      expect(res.resultsByCategory).toBeDefined();

      const expectedCategories: SearchResultCategory[] = [
        "domain",
        "setting",
        "feature_switch",
        "route",
        "business_parameter",
        "dictionary_key",
        "action",
      ];

      for (const cat of expectedCategories) {
        expect(Array.isArray(res.resultsByCategory[cat])).toBe(true);
      }

      expect(res.resultsByCategory.setting.length).toBeGreaterThan(0);
      expect(res.resultsByCategory.action.length).toBeGreaterThan(0);
    });

    it("enriches all search results with valid navigation action links", () => {
      const res = universalSearchEngine.search("killswitch");
      expect(res.topResults.length).toBeGreaterThan(0);

      const killswitch = res.topResults.find((r) => r.id === "switch:infra:global_emergency_freeze");
      expect(killswitch).toBeDefined();
      expect(killswitch!.actionLink).toEqual({
        targetDomain: "infra_security",
        targetApp: "infra",
        route: "/admin/security/killswitches",
        deepLink: "infra://switches/global-freeze",
        actionType: "TOGGLE_SWITCH",
        commandId: undefined,
        parameters: undefined,
      });

      // Check action with commandId
      const actionRes = universalSearchEngine.search("command palette");
      const paletteItem = actionRes.topResults.find((r) => r.id === "action:umaros:open_command_palette");
      expect(paletteItem).toBeDefined();
      expect(paletteItem!.actionLink.actionType).toBe("TRIGGER_COMMAND");
      expect(paletteItem!.actionLink.commandId).toBe("action:open_command_palette");
    });
  });

  // ==========================================================================
  // 7. DYNAMIC ENGINE MUTATIONS, AUTOCOMPLETE & FILTERING
  // ==========================================================================
  describe("Dynamic Index Management & Filtering", () => {
    it("supports adding, updating, and removing custom items dynamically", () => {
      const engine = createMultilingualSearchEngine([]);
      expect(engine.getAllItems()).toHaveLength(0);

      const testItem: SearchIndexItem = {
        id: "setting:custom:fuel_allowance",
        domain: "rider_app",
        category: "setting",
        title: {
          en: "Custom Rider Fuel Allowance Policy",
          hi: "कस्टम राइडर ईंधन भत्ता नीति",
          bn: "কাস্টম রাইডার জ্বালানী ভাতা নীতি",
          as: "কাষ্টম ৰাইডাৰ ইন্ধন বানচ নীতি",
        },
        description: {
          en: "Configure weekly reimbursement per kilometer for EV vs petrol vehicles.",
          hi: "ईवी बनाम पेट्रोल वाहनों के लिए प्रति किलोमीटर साप्ताहिक प्रतिपूर्ति कॉन्फ़िगर करें।",
          bn: "ইভি বনাম পেট্রোল গাড়ির জন্য প্রতি কিলোমিটারে সাপ্তাহিক খরচ কনফিগার করুন।",
          as: "ইভি বনাম পেট্ৰল বাহনৰ বাবে প্ৰতি কিলোমিটাৰত সাপ্তাহিক ধন নিৰ্ধাৰণ কৰক।",
        },
        keywords: {
          en: ["fuel", "petrol", "allowance", "reimbursement", "ev"],
          hi: ["ईंधन", "पेट्रोल", "भत्ता"],
          bn: ["জ্বালানী", "ভাতা"],
          as: ["ইন্ধন", "বানচ"],
        },
        route: "/admin/rider/fuel-policy",
        deepLink: "rider://settings/fuel",
        actionType: "OPEN_DRAWER",
      };

      engine.addItem(testItem);
      expect(engine.getAllItems()).toHaveLength(1);

      const search1 = engine.search("petrol");
      expect(search1.totalMatches).toBe(1);
      expect(search1.topResults[0].id).toBe(testItem.id);

      // Update item
      const updated = engine.updateItem(testItem.id, {
        priority: 1,
      });
      expect(updated).toBe(true);

      // Remove item
      const removed = engine.removeItem(testItem.id);
      expect(removed).toBe(true);
      expect(engine.getAllItems()).toHaveLength(0);
    });

    it("filters search queries by domain and category", () => {
      // Filter by domain = 'rider_app'
      const riderOnly = universalSearchEngine.search("payout", {
        domain: "rider_app",
      });
      for (const res of riderOnly.topResults) {
        expect(res.domain).toBe("rider_app");
      }

      // Filter by category = 'action'
      const actionsOnly = universalSearchEngine.search("settlement", {
        category: "action",
      });
      for (const res of actionsOnly.topResults) {
        expect(res.category).toBe("action");
      }
    });

    it("provides fast autocomplete suggestions for typeahead", () => {
      const suggestions = universalSearchEngine.autocomplete("dock", 5);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text.toLowerCase()).toContain("dock");
      expect(suggestions[0].actionLink.deepLink).toBeTruthy();

      const kingpaySuggestions = universalSearchEngine.autocomplete("kingpay", 5);
      expect(kingpaySuggestions.length).toBeGreaterThan(0);
      expect(kingpaySuggestions[0].domain).toBe("kingpay");
    });

    it("registers custom synonyms dynamically", () => {
      const engine = createMultilingualSearchEngine();
      engine.registerSynonym("chai", ["tea", "चाय", "চা", "চাহ"]);

      const syns = engine.getSynonyms("chai");
      expect(syns).toContain("tea");
      expect(syns).toContain("चाय");
      expect(syns).toContain("চা");
      expect(syns).toContain("চাহ");
    });

    it("catalogs can be retrieved by domain and category", () => {
      const umarOsCatalog = universalSearchEngine.getDomainCatalog("umaros");
      expect(umarOsCatalog.length).toBeGreaterThan(0);
      for (const item of umarOsCatalog) {
        expect(item.domain).toBe("umaros");
      }

      const settingsCatalog = universalSearchEngine.getCategoryCatalog("setting");
      expect(settingsCatalog.length).toBeGreaterThan(0);
      for (const item of settingsCatalog) {
        expect(item.category).toBe("setting");
      }
    });
  });
});
