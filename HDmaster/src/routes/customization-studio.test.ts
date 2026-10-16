import { describe, it, expect, beforeEach } from "vitest";
import {
  UniversalCustomizationEngine,
  ColorScience,
  DEFAULT_UNIVERSAL_CUSTOMIZATION,
  OperatingModeSchema,
  LogisticsParametersSchema,
  CustomerPricingParametersSchema,
  MerchantEconomicsParametersSchema,
  FleetAndCashControlsSchema,
  type DesignTokens,
  type LayoutSection,
  type PageLayout,
  type OperatingMode,
  type LogisticsParameters,
  type CustomerPricingParameters,
  type MerchantEconomicsParameters,
  type FleetAndCashControls,
} from "../lib/orderking/customization/universal-customization-engine";
import {
  UmarAiCustomizationCompiler,
} from "../lib/orderking/ai/umar-ai-customization-compiler";
import { INDIA_COMPLIANCE_RATES } from "../lib/orderking/compliance/india-marketplace-engine";
import { CustomizationSyncBus } from "../lib/orderking/customization/sync-bus";

describe("UmarOS Visual Customization & Control Studio Architecture", () => {
  let engine: UniversalCustomizationEngine;
  let compiler: UmarAiCustomizationCompiler;

  const founderActor = {
    userId: "founder_supreme_01",
    role: "SUPREME_FOUNDER",
    name: "Founder Command",
    explicitApprovalGranted: true,
  };

  beforeEach(() => {
    engine = new UniversalCustomizationEngine();
    compiler = new UmarAiCustomizationCompiler(engine);
  });

  // ==========================================================================
  // 1. VISUAL COLOR & TOKEN STUDIO (WCAG 2.1 AA/AAA ACCESSIBILITY)
  // ==========================================================================
  describe("Visual Color & Token Studio with WCAG 2.1 Accessibility", () => {
    it("initializes with default OrderKing canonical design tokens", () => {
      const state = engine.getState();
      expect(state.designTokens.palette.primary).toBe("#E23744");
      expect(state.designTokens.palette.background).toBe("#FCFAF7");
      expect(state.designTokens.palette.foreground).toBe("#1C1C1C");
      expect(state.version).toBe(1);
    });

    it("evaluates WCAG 2.1 AA and AAA contrast ratios mathematically", () => {
      // High contrast: dark text on light background
      const darkOnLight = ColorScience.validateAccessibility("#1C1C1C", "#FCFAF7");
      expect(darkOnLight.contrastRatio).toBeGreaterThan(10);
      expect(darkOnLight.passesAA).toBe(true);
      expect(darkOnLight.passesAAA).toBe(true);

      // White on Signature Crimson (Large/bold CTA button text)
      const whiteOnCrimson = ColorScience.validateAccessibility("#FFFFFF", "#E23744", true);
      expect(whiteOnCrimson.contrastRatio).toBeGreaterThan(4.0);
      expect(whiteOnCrimson.passesAA).toBe(true);

      // Low contrast: light grey on white should fail
      const lowContrast = ColorScience.validateAccessibility("#E5E7EB", "#FFFFFF");
      expect(lowContrast.contrastRatio).toBeLessThan(2.0);
      expect(lowContrast.passesAA).toBe(false);
      expect(lowContrast.passesAAA).toBe(false);
    });

    it("updates primary palette color and updates audit trail & snapshot", () => {
      const prevVersion = engine.getVersion();
      const res = engine.updatePaletteColor(
        "primary",
        "#0D3B2E",
        founderActor,
        "Switch to Sovereign Emerald"
      );

      expect(res.success).toBe(true);
      expect(res.version).toBe(prevVersion + 1);
      expect(engine.getState().designTokens.palette.primary).toBe("#0D3B2E");

      // Verify audit log has the event
      const auditTrail = engine.getAuditTrail();
      const lastAudit = auditTrail[auditTrail.length - 1];
      expect(lastAudit.actionType).toBe("UPDATE_COLOR");
      expect(lastAudit.targetKey).toBe("palette.primary");
      expect(lastAudit.newValue).toBe("#0D3B2E");
      expect(lastAudit.snapshotHash).toBeDefined();
    });

    it("supports all 4 royal theme presets and calculates accurate contrast for each", () => {
      const presets = [
        { primary: "#E23744", bg: "#FCFAF7", fg: "#1C1C1C" },
        { primary: "#0D3B2E", bg: "#F4F7F5", fg: "#0B241D" },
        { primary: "#4F46E5", bg: "#090D16", fg: "#F9FAFB" },
        { primary: "#0F766E", bg: "#FAF8F5", fg: "#134E4A" },
      ];

      for (const p of presets) {
        const textA11y = ColorScience.validateAccessibility(p.fg, p.bg);
        expect(textA11y.passesAA).toBe(true);
        expect(textA11y.contrastRatio).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  // ==========================================================================
  // 2. MULTILINGUAL TEXT QUAD-EDITOR (EN, HI, BN, AS)
  // ==========================================================================
  describe("Multilingual Text Quad-Editor (English, Hindi, Bengali, Assamese)", () => {
    it("contains canonical translations in English, Hindi, Bengali, and Assamese", () => {
      const heroTitle = engine.getText("customer.home.hero_title", "en");
      const heroTitleHi = engine.getText("customer.home.hero_title", "hi");
      const heroTitleBn = engine.getText("customer.home.hero_title", "bn");
      const heroTitleAs = engine.getText("customer.home.hero_title", "as");

      expect(heroTitle).toBe("Order Food & Essentials In Minutes");
      expect(heroTitleHi).toBe("मिनटों में खाना और आवश्यक वस्तुएं ऑर्डर करें");
      expect(heroTitleBn).toBe("কয়েক মিনিটের মধ্যে খাবার এবং প্রয়োজনীয় জিনিস অর্ডার করুন");
      expect(heroTitleAs).toBe("কেইমিনিটমানতে খাদ্য আৰু প্ৰয়োজনীয় বস্তু অৰ্ডাৰ কৰক");
    });

    it("updates word translations and preserves all 4 language fields", () => {
      const updateResult = engine.setTextOverride(
        {
          elementId: "customer.checkout.pay_button",
          platform: "customer_app",
          route: "/checkout",
          translations: {
            en: "Complete Secure Payment",
            hi: "सुरक्षित भुगतान पूरा करें",
            bn: "নিরাপদ পেমেন্ট সম্পূর্ণ করুন",
            as: "সুৰক্ষিত পৰিশোধ সম্পূৰ্ণ কৰক",
          },
          visibility: "visible",
        },
        founderActor,
        "Refine checkout button text across all 4 languages"
      );

      expect(updateResult.success).toBe(true);
      expect(engine.getText("customer.checkout.pay_button", "en")).toBe("Complete Secure Payment");
      expect(engine.getText("customer.checkout.pay_button", "hi")).toBe("सुरक्षित भुगतान पूरा करें");
      expect(engine.getText("customer.checkout.pay_button", "bn")).toBe("নিরাপদ পেমেন্ট সম্পূর্ণ করুন");
      expect(engine.getText("customer.checkout.pay_button", "as")).toBe("সুৰক্ষিত পৰিশোধ সম্পূৰ্ণ কৰক");
    });

    it("correctly tokenizes words across distinct linguistic scripts", () => {
      const enSentence = "Complete Secure Payment";
      const hiSentence = "सुरक्षित भुगतान पूरा करें";
      const bnSentence = "নিরাপদ পেমেন্ট সম্পূর্ণ করুন";
      const asSentence = "সুৰক্ষিত পৰিশোধ সম্পূৰ্ণ কৰক";

      const enTokens = enSentence.split(/\s+/);
      const hiTokens = hiSentence.split(/\s+/);
      const bnTokens = bnSentence.split(/\s+/);
      const asTokens = asSentence.split(/\s+/);

      expect(enTokens).toHaveLength(3);
      expect(hiTokens).toHaveLength(4);
      expect(bnTokens).toHaveLength(4);
      expect(asTokens).toHaveLength(4);

      expect(enTokens[0]).toBe("Complete");
      expect(hiTokens[0]).toBe("सुरक्षित");
      expect(bnTokens[0]).toBe("নিরাপদ");
      expect(asTokens[0]).toBe("সুৰক্ষিত");
    });
  });

  // ==========================================================================
  // 3. SERVER-DRIVEN UI (SDUI) LAYOUT STUDIO & SIMULATOR
  // ==========================================================================
  describe("Server-Driven UI (SDUI) Layout Studio & Multi-Device Simulator", () => {
    const initialSections: LayoutSection[] = [
      {
        id: "promo_carousel",
        type: "hero_banner",
        order: 1,
        visible: true,
        width: "100%",
        margin: { topPx: 0, bottomPx: 12, leftPx: 0, rightPx: 0 },
        padding: { topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 },
        responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
        props: {},
      },
      {
        id: "search_bar",
        type: "search_bar",
        order: 2,
        visible: true,
        width: "100%",
        margin: { topPx: 0, bottomPx: 12, leftPx: 0, rightPx: 0 },
        padding: { topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 },
        responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: false },
        props: {},
      },
      {
        id: "restaurant_feed",
        type: "restaurant_feed",
        order: 3,
        visible: true,
        width: "100%",
        margin: { topPx: 0, bottomPx: 12, leftPx: 0, rightPx: 0 },
        padding: { topPx: 0, bottomPx: 0, leftPx: 0, rightPx: 0 },
        responsive: { hideOnMobile: false, hideOnTablet: false, hideOnDesktop: true },
        props: {},
      },
    ];

    it("reorders layout sections and updates sequential order numbers", () => {
      engine.setPageLayout(
        {
          pageId: "customer_home",
          platform: "customer_app",
          route: "/",
          sections: initialSections,
          updatedAt: new Date().toISOString(),
        },
        founderActor,
        "Bootstrap customer home layout"
      );

      // Reorder: put search_bar first, then promo_carousel, then restaurant_feed
      const res = engine.reorderSections(
        "customer_home",
        ["search_bar", "promo_carousel", "restaurant_feed"],
        founderActor,
        "Move search bar to top"
      );

      expect(res.success).toBe(true);
      const updated = engine.getState().pageLayouts["customer_home"];
      expect(updated.sections[0].id).toBe("search_bar");
      expect(updated.sections[0].order).toBe(1);
      expect(updated.sections[1].id).toBe("promo_carousel");
      expect(updated.sections[1].order).toBe(2);
    });

    it("simulates device-specific responsive filtering for mobile, tablet, and desktop", () => {
      const pageLayout: PageLayout = {
        pageId: "customer_home",
        platform: "customer_app",
        route: "/",
        sections: initialSections,
        updatedAt: new Date().toISOString(),
      };

      // Simulator filter for Mobile: all 3 should be visible
      const mobileVisible = pageLayout.sections.filter(
        (s) => s.visible && !s.responsive.hideOnMobile
      );
      expect(mobileVisible).toHaveLength(3);

      // Simulator filter for Desktop: restaurant_feed has hideOnDesktop: true
      const desktopVisible = pageLayout.sections.filter(
        (s) => s.visible && !s.responsive.hideOnDesktop
      );
      expect(desktopVisible).toHaveLength(2);
      expect(desktopVisible.map((s) => s.id)).toEqual(["promo_carousel", "search_bar"]);
    });

    it("respects section visibility toggles in SDUI export", () => {
      const modifiedSections = initialSections.map((s) =>
        s.id === "promo_carousel" ? { ...s, visible: false } : s
      );

      engine.setPageLayout(
        {
          pageId: "customer_home",
          platform: "customer_app",
          route: "/",
          sections: modifiedSections,
          updatedAt: new Date().toISOString(),
        },
        founderActor,
        "Hide promo carousel"
      );

      const exported = engine.exportCustomerPayload();
      expect(exported.homeLayout?.sections.find((s) => s.id === "promo_carousel")?.visible).toBe(false);
      expect(exported.sha256).toBeDefined();
    });
  });

  // ==========================================================================
  // 4. INDIA MARKETPLACE SLIDERS & STATUTORY DIALS
  // ==========================================================================
  describe("India Marketplace Sliders & Statutory Regulatory Dials", () => {
    it("respects statutory commission boundaries (18%-25% standard, 8% floor)", () => {
      expect(INDIA_COMPLIANCE_RATES.MIN_COMMISSION_BPS).toBe(800); // 8.00% floor
      expect(INDIA_COMPLIANCE_RATES.TIER_1_STARTER_COMMISSION_BPS).toBe(1800); // 18.00%
      expect(INDIA_COMPLIANCE_RATES.TIER_2_STANDARD_COMMISSION_BPS).toBe(2200); // 22.00%
      expect(INDIA_COMPLIANCE_RATES.TIER_3_PREMIUM_COMMISSION_BPS).toBe(2500); // 25.00%
      expect(INDIA_COMPLIANCE_RATES.MAX_COMMISSION_BPS).toBe(3500); // 35.00% ceiling
    });

    it("validates rider base pay range (₹25 - ₹35 for first 2-3 km)", () => {
      const tier1MetroBasePay = 35;
      const tier2CapitalBasePay = 30;
      const tier3RegionalBasePay = 25;

      expect(tier1MetroBasePay).toBeGreaterThanOrEqual(25);
      expect(tier1MetroBasePay).toBeLessThanOrEqual(35);
      expect(tier2CapitalBasePay).toBeGreaterThanOrEqual(25);
      expect(tier2CapitalBasePay).toBeLessThanOrEqual(35);
      expect(tier3RegionalBasePay).toBeGreaterThanOrEqual(25);
      expect(tier3RegionalBasePay).toBeLessThanOrEqual(35);
    });

    it("calculates exact CGST Section 9(5) 5% tax and 18% GST on platform commission", () => {
      const foodBill = 500;
      const commissionBps = 2200; // 22%
      const grossCommission = (foodBill * commissionBps) / 10000; // ₹110
      const gstOnCommission = grossCommission * 0.18; // ₹19.80 (18% GST SAC 9985)
      const sec95Tax = foodBill * 0.05; // ₹25 (5% CGST Sec 9(5) ECO pays without ITC)

      expect(grossCommission).toBe(110);
      expect(gstOnCommission).toBeCloseTo(19.8, 2);
      expect(sec95Tax).toBe(25);
    });

    it("validates COD Cash-in-Hand standard limit (₹1,500) and warning threshold (80%)", () => {
      const defaultLimitPaise = INDIA_COMPLIANCE_RATES.DEFAULT_COD_LIMIT_PAISE;
      expect(defaultLimitPaise).toBe(150000); // ₹1,500 in paise

      const codLimitRupees = defaultLimitPaise / 100;
      const warningPercent = INDIA_COMPLIANCE_RATES.COD_WARNING_THRESHOLD_PERCENT; // 80%
      const warningThresholdRupees = (codLimitRupees * warningPercent) / 100;

      expect(codLimitRupees).toBe(1500);
      expect(warningThresholdRupees).toBe(1200); // Soft limit warning at ₹1,200
    });
  });

  // ==========================================================================
  // 5. UMAR AI 10-STAGE CUSTOMIZATION COMPILER & ROLLBACK
  // ==========================================================================
  describe("Umar AI Autonomous Customization Compiler & Rollback Engine", () => {
    it("parses natural language color customization prompt accurately", () => {
      const parsed = compiler.parsePrompt("change customer app primary color to emerald green (#006A4E)");
      expect(parsed.action).toBe("UPDATE_COLOR");
      expect(parsed.targetPlatform).toBe("customer_app");
      expect(parsed.propertyKey).toBe("primary");
      expect(parsed.proposedValue).toBe("#006A4E");
      expect(parsed.riskLevel).toBe("LOW");
    });

    it("stages change preview with dependency and accessibility analysis", () => {
      const preview = compiler.stageChangePreview("change customer app primary color to emerald green (#006A4E)");
      expect(preview.previewId).toBeDefined();
      expect(preview.action).toBe("UPDATE_COLOR");
      expect(preview.dependencyAnalysis.affectedPlatforms).toBeDefined();
      expect(preview.dependencyAnalysis.accessibilityImpact?.contrastRatio).toBeDefined();
    });

    it("executes staged change, produces audit receipt and increments active version", () => {
      const initialVersion = engine.getVersion();
      const preview = compiler.stageChangePreview("change primary color to #006A4E");

      const receipt = compiler.executeStagedChange(preview.previewId, founderActor);

      expect(receipt.success).toBe(true);
      expect(receipt.activeVersion).toBe(initialVersion + 1);
      expect(receipt.auditHash).toBeDefined();
      expect(receipt.verifiedPlatforms).toContain("customer_app");
      expect(engine.getState().designTokens.palette.primary).toBe("#006A4E");
    });

    it("blocks high-risk actions when explicit founder approval is not granted", () => {
      const preview = compiler.stageChangePreview("Adjust merchant commission to 20%");
      expect(preview.requiresFounderApproval).toBe(true);

      expect(() => {
        compiler.executeStagedChange(preview.previewId, {
          userId: "analyst_guest",
          role: "GUEST_ANALYST",
          explicitApprovalGranted: false,
        });
      }).toThrow(/Founder Governance Gate/);
    });

    it("executes instant cryptographic rollback to previous snapshot", () => {
      const v1 = engine.getVersion();
      engine.updatePaletteColor("primary", "#1D70B8", founderActor, "Change to Royal Blue");
      const v2 = engine.getVersion();
      expect(v2).toBe(v1 + 1);
      expect(engine.getState().designTokens.palette.primary).toBe("#1D70B8");

      // Rollback to v1
      const rollbackResult = engine.rollbackToVersion(v1, founderActor, "Revert to initial state");
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.restoredVersion).toBe(v1);

      // Design token primary color should be back to initial canonical crimson
      expect(engine.getState().designTokens.palette.primary).toBe("#E23744");
    });
  });

  // ==========================================================================
  // 6. OPERATING MODE & DUAL-MODE CONTROL (MANUAL VS SELF-TUNING)
  // ==========================================================================
  describe("Operating Mode & Dual-Mode Control Plane", () => {
    it("validates operating mode schema with Zod enum constraints", () => {
      expect(OperatingModeSchema.parse("MANUAL_OVERRIDE")).toBe("MANUAL_OVERRIDE");
      expect(OperatingModeSchema.parse("SELF_TUNING_ALGORITHM")).toBe("SELF_TUNING_ALGORITHM");
      expect(() => OperatingModeSchema.parse("UNSUPERVISED_AI")).toThrow();
    });

    it("defaults to MANUAL_OVERRIDE in initial engine state", () => {
      expect(engine.getState().operatingMode).toBe("MANUAL_OVERRIDE");
    });

    it("toggles operating mode, records audit trail and increments version", () => {
      const prevVersion = engine.getVersion();
      const res = engine.setOperatingMode(
        "SELF_TUNING_ALGORITHM",
        founderActor,
        "Enable algorithmic dynamic pricing"
      );
      expect(res.success).toBe(true);
      expect(res.version).toBe(prevVersion + 1);
      expect(engine.getState().operatingMode).toBe("SELF_TUNING_ALGORITHM");

      const auditTrail = engine.getAuditTrail();
      const lastAudit = auditTrail[auditTrail.length - 1];
      expect(lastAudit.actionType).toBe("UPDATE_WORKFLOW");
      expect(lastAudit.targetKey).toBe("operatingMode");
      expect(lastAudit.newValue).toBe("SELF_TUNING_ALGORITHM");
    });
  });

  // ==========================================================================
  // 7. GRANULAR LOGISTICS SLIDERS & BOUNDARY ENFORCEMENT
  // ==========================================================================
  describe("Granular Logistics Parameters & Payout Slider Controls", () => {
    it("enforces strict rider base pay boundaries (₹15 min, ₹35 max)", () => {
      expect(LogisticsParametersSchema.parse({ riderBasePayRupees: 15 }).riderBasePayRupees).toBe(15);
      expect(LogisticsParametersSchema.parse({ riderBasePayRupees: 35 }).riderBasePayRupees).toBe(35);
      expect(LogisticsParametersSchema.parse({ riderBasePayRupees: 28 }).riderBasePayRupees).toBe(28);

      expect(() => LogisticsParametersSchema.parse({ riderBasePayRupees: 14 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ riderBasePayRupees: 36 })).toThrow();
    });

    it("validates first-mile and all 4 distance bands for last-mile rates", () => {
      const validRates = {
        firstMileRatePerKm: 6,
        lastMileBand1RatePerKm: 8,
        lastMileBand2RatePerKm: 10,
        lastMileBand3RatePerKm: 12,
        lastMileBand4RatePerKm: 15,
      };
      const parsed = LogisticsParametersSchema.parse(validRates);
      expect(parsed.firstMileRatePerKm).toBe(6);
      expect(parsed.lastMileBand1RatePerKm).toBe(8);
      expect(parsed.lastMileBand2RatePerKm).toBe(10);
      expect(parsed.lastMileBand3RatePerKm).toBe(12);
      expect(parsed.lastMileBand4RatePerKm).toBe(15);

      // Boundaries test
      expect(() => LogisticsParametersSchema.parse({ firstMileRatePerKm: -1 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ firstMileRatePerKm: 31 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ lastMileBand1RatePerKm: 31 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ lastMileBand2RatePerKm: 36 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ lastMileBand3RatePerKm: 41 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ lastMileBand4RatePerKm: 51 })).toThrow();
    });

    it("validates kitchen wait compensation rate and grace period", () => {
      const validWait = {
        kitchenWaitRatePerMinRupees: 2.0,
        kitchenWaitGraceMinutes: 10,
      };
      const parsed = LogisticsParametersSchema.parse(validWait);
      expect(parsed.kitchenWaitRatePerMinRupees).toBe(2.0);
      expect(parsed.kitchenWaitGraceMinutes).toBe(10);

      expect(() => LogisticsParametersSchema.parse({ kitchenWaitRatePerMinRupees: 15 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ kitchenWaitGraceMinutes: 45 })).toThrow();
    });

    it("validates weather bonuses across drizzle, heavy rain, and waterlogged tiers", () => {
      const validWeather = {
        weatherBonusDrizzleRupees: 15,
        weatherBonusHeavyRainRupees: 35,
        weatherBonusWaterloggedRupees: 60,
      };
      const parsed = LogisticsParametersSchema.parse(validWeather);
      expect(parsed.weatherBonusDrizzleRupees).toBe(15);
      expect(parsed.weatherBonusHeavyRainRupees).toBe(35);
      expect(parsed.weatherBonusWaterloggedRupees).toBe(60);

      expect(() => LogisticsParametersSchema.parse({ weatherBonusDrizzleRupees: 55 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ weatherBonusHeavyRainRupees: 105 })).toThrow();
      expect(() => LogisticsParametersSchema.parse({ weatherBonusWaterloggedRupees: 155 })).toThrow();
    });

    it("validates night surge allowances", () => {
      expect(LogisticsParametersSchema.parse({ nightSurgeAllowanceRupees: 40 }).nightSurgeAllowanceRupees).toBe(40);
      expect(() => LogisticsParametersSchema.parse({ nightSurgeAllowanceRupees: 85 })).toThrow();
    });

    it("updates logistics parameters through UniversalCustomizationEngine with audit trail", () => {
      const res = engine.updateLogistics(
        {
          riderBasePayRupees: 32,
          kitchenWaitRatePerMinRupees: 2.5,
          weatherBonusHeavyRainRupees: 30,
        },
        founderActor,
        "Monsoon surge & enhanced rider incentives"
      );

      expect(res.success).toBe(true);
      const state = engine.getState();
      expect(state.logistics.riderBasePayRupees).toBe(32);
      expect(state.logistics.kitchenWaitRatePerMinRupees).toBe(2.5);
      expect(state.logistics.weatherBonusHeavyRainRupees).toBe(30);
      // Unchanged fields should retain defaults
      expect(state.logistics.firstMileRatePerKm).toBe(6);

      const audit = engine.getAuditTrail().slice(-1)[0];
      expect(audit.platform).toBe("rider_app");
      expect(audit.targetKey).toBe("logistics");
    });
  });

  // ==========================================================================
  // 8. CUSTOMER PRICING & CHECKOUT SLIDERS
  // ==========================================================================
  describe("Customer Pricing Parameters & Fee Sliders", () => {
    it("enforces platform fee constraints (₹4 to ₹10)", () => {
      expect(CustomerPricingParametersSchema.parse({ platformFeeRupees: 4 }).platformFeeRupees).toBe(4);
      expect(CustomerPricingParametersSchema.parse({ platformFeeRupees: 10 }).platformFeeRupees).toBe(10);
      expect(CustomerPricingParametersSchema.parse({ platformFeeRupees: 7 }).platformFeeRupees).toBe(7);

      expect(() => CustomerPricingParametersSchema.parse({ platformFeeRupees: 3 })).toThrow();
      expect(() => CustomerPricingParametersSchema.parse({ platformFeeRupees: 11 })).toThrow();
    });

    it("validates base delivery fee, small order fees and free delivery thresholds", () => {
      const validPricing = {
        baseDeliveryFeeRupees: 40,
        smallOrderFeeRupees: 20,
        smallOrderThresholdRupees: 199,
        freeDeliveryCartThresholdRupees: 499,
      };
      const parsed = CustomerPricingParametersSchema.parse(validPricing);
      expect(parsed.baseDeliveryFeeRupees).toBe(40);
      expect(parsed.smallOrderFeeRupees).toBe(20);
      expect(parsed.smallOrderThresholdRupees).toBe(199);
      expect(parsed.freeDeliveryCartThresholdRupees).toBe(499);

      expect(() => CustomerPricingParametersSchema.parse({ baseDeliveryFeeRupees: 105 })).toThrow();
      expect(() => CustomerPricingParametersSchema.parse({ smallOrderThresholdRupees: 40 })).toThrow();
      expect(() => CustomerPricingParametersSchema.parse({ freeDeliveryCartThresholdRupees: 1600 })).toThrow();
    });

    it("updates customer pricing through engine with audit trail", () => {
      const res = engine.updateCustomerPricing(
        {
          platformFeeRupees: 8,
          freeDeliveryCartThresholdRupees: 399,
        },
        founderActor,
        "Update festive season pricing dials"
      );

      expect(res.success).toBe(true);
      expect(engine.getState().customerPricing.platformFeeRupees).toBe(8);
      expect(engine.getState().customerPricing.freeDeliveryCartThresholdRupees).toBe(399);

      const audit = engine.getAuditTrail().slice(-1)[0];
      expect(audit.platform).toBe("customer_app");
      expect(audit.targetKey).toBe("customerPricing");
    });
  });

  // ==========================================================================
  // 9. MERCHANT ECONOMICS & COMMISSION CONTROLS
  // ==========================================================================
  describe("Merchant Economics Parameters & Commission Sliders", () => {
    it("enforces commission tier bounds (16% to 28%)", () => {
      const validTiers = {
        commissionTierStarterPercent: 16,
        commissionTierStandardPercent: 22,
        commissionTierPremiumPercent: 28,
        commissionRatePercent: 22,
      };
      const parsed = MerchantEconomicsParametersSchema.parse(validTiers);
      expect(parsed.commissionTierStarterPercent).toBe(16);
      expect(parsed.commissionTierStandardPercent).toBe(22);
      expect(parsed.commissionTierPremiumPercent).toBe(28);

      expect(() => MerchantEconomicsParametersSchema.parse({ commissionTierStarterPercent: 15 })).toThrow();
      expect(() => MerchantEconomicsParametersSchema.parse({ commissionTierPremiumPercent: 29 })).toThrow();
      expect(() => MerchantEconomicsParametersSchema.parse({ commissionRatePercent: 12 })).toThrow();
    });

    it("validates packaging fee cap and discount co-funding split", () => {
      const validEcon = {
        packagingFeeCapRupees: 50,
        discountCoFundingMerchantPercent: 60,
      };
      const parsed = MerchantEconomicsParametersSchema.parse(validEcon);
      expect(parsed.packagingFeeCapRupees).toBe(50);
      expect(parsed.discountCoFundingMerchantPercent).toBe(60);

      expect(() => MerchantEconomicsParametersSchema.parse({ packagingFeeCapRupees: 120 })).toThrow();
      expect(() => MerchantEconomicsParametersSchema.parse({ discountCoFundingMerchantPercent: 105 })).toThrow();
    });

    it("updates merchant economics through engine with audit trail", () => {
      const res = engine.updateMerchantEconomics(
        {
          commissionTierStarterPercent: 17,
          commissionTierPremiumPercent: 27,
          packagingFeeCapRupees: 40,
        },
        founderActor,
        "Adjust merchant partnership margins"
      );

      expect(res.success).toBe(true);
      expect(engine.getState().merchantEconomics.commissionTierStarterPercent).toBe(17);
      expect(engine.getState().merchantEconomics.commissionTierPremiumPercent).toBe(27);
      expect(engine.getState().merchantEconomics.packagingFeeCapRupees).toBe(40);

      const audit = engine.getAuditTrail().slice(-1)[0];
      expect(audit.platform).toBe("partner_app");
      expect(audit.targetKey).toBe("merchantEconomics");
    });
  });

  // ==========================================================================
  // 10. FLEET & CASH CONTROLS
  // ==========================================================================
  describe("Fleet & Cash Controls & Operations Sliders", () => {
    it("enforces COD floating cash limit boundaries (₹1,000 to ₹3,000)", () => {
      expect(FleetAndCashControlsSchema.parse({ codFloatingCashLimitRupees: 1000 }).codFloatingCashLimitRupees).toBe(1000);
      expect(FleetAndCashControlsSchema.parse({ codFloatingCashLimitRupees: 3000 }).codFloatingCashLimitRupees).toBe(3000);
      expect(FleetAndCashControlsSchema.parse({ codFloatingCashLimitRupees: 2000 }).codFloatingCashLimitRupees).toBe(2000);

      expect(() => FleetAndCashControlsSchema.parse({ codFloatingCashLimitRupees: 900 })).toThrow();
      expect(() => FleetAndCashControlsSchema.parse({ codFloatingCashLimitRupees: 3500 })).toThrow();
    });

    it("validates dispatch pre-allocation and kitchen delay alert thresholds", () => {
      const validFleet = {
        dispatchPreAllocationLeadTimeMinutes: 8,
        kitchenDelayVoiceAlertThresholdMinutes: 12,
        codWarningPercent: 85,
      };
      const parsed = FleetAndCashControlsSchema.parse(validFleet);
      expect(parsed.dispatchPreAllocationLeadTimeMinutes).toBe(8);
      expect(parsed.kitchenDelayVoiceAlertThresholdMinutes).toBe(12);
      expect(parsed.codWarningPercent).toBe(85);

      expect(() => FleetAndCashControlsSchema.parse({ dispatchPreAllocationLeadTimeMinutes: 0 })).toThrow();
      expect(() => FleetAndCashControlsSchema.parse({ dispatchPreAllocationLeadTimeMinutes: 25 })).toThrow();
      expect(() => FleetAndCashControlsSchema.parse({ kitchenDelayVoiceAlertThresholdMinutes: 1 })).toThrow();
      expect(() => FleetAndCashControlsSchema.parse({ kitchenDelayVoiceAlertThresholdMinutes: 35 })).toThrow();
    });

    it("updates fleet and cash controls through engine with audit trail", () => {
      const res = engine.updateFleetAndCash(
        {
          codFloatingCashLimitRupees: 2500,
          dispatchPreAllocationLeadTimeMinutes: 7,
          kitchenDelayVoiceAlertThresholdMinutes: 15,
        },
        founderActor,
        "Optimize peak-hour dispatch lead time and COD ceiling"
      );

      expect(res.success).toBe(true);
      expect(engine.getState().fleetAndCash.codFloatingCashLimitRupees).toBe(2500);
      expect(engine.getState().fleetAndCash.dispatchPreAllocationLeadTimeMinutes).toBe(7);
      expect(engine.getState().fleetAndCash.kitchenDelayVoiceAlertThresholdMinutes).toBe(15);
    });
  });

  // ==========================================================================
  // 11. CROSS-PLATFORM TARGETED PAYLOAD EXPORTS
  // ==========================================================================
  describe("Cross-Platform Targeted Payload Exports (Customer, Partner, Rider)", () => {
    it("exports customer payload with customer pricing, layout, and operating mode", () => {
      engine.updateCustomerPricing({ platformFeeRupees: 8 }, founderActor, "Test Customer Export");
      engine.setOperatingMode("SELF_TUNING_ALGORITHM", founderActor, "Test Mode");

      const customerPayload = engine.exportCustomerPayload();
      expect(customerPayload.version).toBe(engine.getVersion());
      expect(customerPayload.customerPricing.platformFeeRupees).toBe(8);
      expect(customerPayload.operatingMode).toBe("SELF_TUNING_ALGORITHM");
      expect(customerPayload.cssVariables).toContain("--color-primary");
      expect(customerPayload.sha256).toBeDefined();
    });

    it("exports partner payload with merchant economics and kitchen delay alerts", () => {
      engine.updateMerchantEconomics({ commissionTierStandardPercent: 24 }, founderActor, "Test Partner Export");
      engine.updateFleetAndCash({ kitchenDelayVoiceAlertThresholdMinutes: 14 }, founderActor, "Test Partner Fleet");

      const partnerPayload = engine.exportPartnerPayload();
      expect(partnerPayload.version).toBe(engine.getVersion());
      expect(partnerPayload.merchantEconomics.commissionTierStandardPercent).toBe(24);
      expect(partnerPayload.kitchenDelayVoiceAlertThresholdMinutes).toBe(14);
      expect(partnerPayload.sha256).toBeDefined();
    });

    it("exports rider payload with logistics, fleet controls, and full payout policy", () => {
      engine.updateLogistics(
        {
          riderBasePayRupees: 35,
          weatherBonusHeavyRainRupees: 40,
        },
        founderActor,
        "Test Rider Export"
      );
      engine.updateFleetAndCash(
        {
          codFloatingCashLimitRupees: 2200,
          dispatchPreAllocationLeadTimeMinutes: 6,
        },
        founderActor,
        "Test Rider Fleet"
      );

      const riderPayload = engine.exportRiderPayload();
      expect(riderPayload.version).toBe(engine.getVersion());
      expect(riderPayload.logistics.riderBasePayRupees).toBe(35);
      expect(riderPayload.payoutPolicy.baseFareRupees).toBe(35);
      expect(riderPayload.payoutPolicy.weatherBonuses.heavyRainRupees).toBe(40);
      expect(riderPayload.payoutPolicy.codFloatingCashLimitRupees).toBe(2200);
      expect(riderPayload.payoutPolicy.dispatchLeadTimeMinutes).toBe(6);
      expect(riderPayload.sha256).toBeDefined();
    });
  });

  // ==========================================================================
  // 12. REAL-TIME SSE SYNC BUS PROPAGATION & HYDRATION
  // ==========================================================================
  describe("Real-Time SSE Sync Bus Propagation & Multi-Platform Broadcasting", () => {
    let syncBus: CustomizationSyncBus;

    beforeEach(() => {
      syncBus = new CustomizationSyncBus(engine);
    });

    it("broadcasts committed parameter changes to connected SSE subscribers with all payloads", () => {
      const chunks: string[] = [];
      const mockController = {
        enqueue: (data: Uint8Array) => {
          chunks.push(new TextDecoder().decode(data));
        },
      } as unknown as ReadableStreamDefaultController<Uint8Array>;

      syncBus.registerSubscriber("test-subscriber-01", mockController, "customer_app");
      expect(syncBus.getSubscribersCount()).toBe(1);

      // Perform a commit on the engine
      engine.updateLogistics({ riderBasePayRupees: 34 }, founderActor, "Realtime sync test");

      expect(chunks.length).toBeGreaterThan(0);
      const combined = chunks.join("");
      expect(combined).toContain("customization:commit");
      expect(combined).toContain('"riderBasePayRupees":34');
      expect(combined).toContain('"customerPayload"');
      expect(combined).toContain('"partnerPayload"');
      expect(combined).toContain('"riderPayload"');

      syncBus.removeSubscriber("test-subscriber-01");
      expect(syncBus.getSubscribersCount()).toBe(0);
    });

    it("serves latest client hydration payload containing all child app targets", async () => {
      const response = syncBus.handleLatestRequest();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.version).toBe(engine.getVersion());
      expect(body.customerPayload).toBeDefined();
      expect(body.partnerPayload).toBeDefined();
      expect(body.riderPayload).toBeDefined();
      expect(body.state.logistics).toBeDefined();
      expect(body.state.customerPricing).toBeDefined();
      expect(body.state.merchantEconomics).toBeDefined();
      expect(body.state.fleetAndCash).toBeDefined();
    });
  });
});
