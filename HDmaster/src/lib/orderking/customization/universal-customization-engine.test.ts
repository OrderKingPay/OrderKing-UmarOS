import { describe, expect, it } from "vitest";
import {
  ColorScience,
  DEFAULT_UNIVERSAL_CUSTOMIZATION,
  UniversalCustomizationEngine,
} from "./universal-customization-engine";

describe("UniversalCustomizationEngine (UmarOS Core)", () => {
  const founderActor = {
    userId: "founder_umar_01",
    role: "SUPREME_FOUNDER",
    name: "Founder Umar",
  };

  it("initializes with complete canonical customization state at version 1", () => {
    const engine = new UniversalCustomizationEngine();
    expect(engine.getVersion()).toBe(1);

    const state = engine.getState();
    expect(state.designTokens.palette.primary).toBe("#E23744");
    expect(state.textOverrides["customer.home.hero_title"]).toBeDefined();
    expect(state.pageLayouts["customer_home"]).toBeDefined();
    expect(state.pageLayouts["customer_home"].sections.length).toBe(5);
  });

  it("accurately calculates color luminance and WCAG 2.1 contrast ratios", () => {
    // Pure White (#FFFFFF) vs Pure Black (#000000) = 21:1
    const maxContrast = ColorScience.getContrastRatio("#FFFFFF", "#000000");
    expect(maxContrast).toBe(21);

    // Signature Red (#E23744) vs White (#FFFFFF)
    const redOnWhite = ColorScience.validateAccessibility("#E23744", "#FFFFFF");
    expect(redOnWhite.contrastRatio).toBeGreaterThan(3.5);

    // Dark Text (#1C1C1C) on Background (#FCFAF7)
    const bodyA11y = ColorScience.validateAccessibility("#1C1C1C", "#FCFAF7");
    expect(bodyA11y.passesAA).toBe(true);
    expect(bodyA11y.passesAAA).toBe(true);
  });

  it("updates text and translations across English, Hindi, Bengali, and Assamese", () => {
    const engine = new UniversalCustomizationEngine();

    const res = engine.setTextOverride(
      {
        elementId: "customer.checkout.pay_button",
        platform: "customer_app",
        route: "/checkout",
        translations: {
          en: "Pay & Enjoy Meal",
          hi: "भुगतान करें और भोजन का आनंद लें",
          bn: "পেমেন্ট করুন এবং খাবার উপভোগ করুন",
          as: "পৰিশোধ কৰক আৰু খাদ্য উপভোগ কৰক",
        },
        typography: {
          fontSizePx: 18,
          fontWeight: 800,
          alignment: "center",
        },
        visibility: "visible",
      },
      founderActor,
      "Founder requested friendlier checkout button wording"
    );

    expect(res.success).toBe(true);
    expect(engine.getVersion()).toBe(2);

    expect(engine.getText("customer.checkout.pay_button", "en")).toBe("Pay & Enjoy Meal");
    expect(engine.getText("customer.checkout.pay_button", "hi")).toBe("भुगतान करें और भोजन का आनंद लें");
    expect(engine.getText("customer.checkout.pay_button", "bn")).toBe("পেমেন্ট করুন এবং খাবার উপভোগ করুন");
    expect(engine.getText("customer.checkout.pay_button", "as")).toBe("পৰিশোধ কৰক আৰু খাদ্য উপভোগ কৰক");
  });

  it("updates palette colors and verifies WCAG accessibility compliance", () => {
    const engine = new UniversalCustomizationEngine();

    // Update primary brand color to Royal Emerald Green (#006A4E)
    const res = engine.updatePaletteColor(
      "primary",
      "#006A4E",
      founderActor,
      "Eco-friendly branding refresh"
    );

    expect(res.success).toBe(true);
    expect(engine.getVersion()).toBe(2);
    expect(engine.getState().designTokens.palette.primary).toBe("#006A4E");
    expect(res.accessibility.passesAA).toBe(true);
  });

  it("reorders layout sections for Server-Driven UI (SDUI)", () => {
    const engine = new UniversalCustomizationEngine();

    // Move promo_carousel (originally 3) to the very top (index 1)
    const newOrder = [
      "promo_carousel",
      "header_location",
      "search_bar",
      "top_categories",
      "restaurant_feed",
    ];

    const res = engine.reorderSections("customer_home", newOrder, founderActor, "Boost promo visibility");
    expect(res.success).toBe(true);
    expect(engine.getVersion()).toBe(2);

    const updatedHome = engine.getState().pageLayouts["customer_home"];
    expect(updatedHome.sections[0].id).toBe("promo_carousel");
    expect(updatedHome.sections[0].order).toBe(1);
    expect(updatedHome.sections[1].id).toBe("header_location");
    expect(updatedHome.sections[1].order).toBe(2);
  });

  it("performs atomic rollback to any historical version with complete state restoration", () => {
    const engine = new UniversalCustomizationEngine();
    const v1State = JSON.parse(JSON.stringify(engine.getState()));

    // Change 1: Update color (v2)
    engine.updatePaletteColor("primary", "#123456", founderActor, "Test color");
    expect(engine.getVersion()).toBe(2);
    expect(engine.getState().designTokens.palette.primary).toBe("#123456");

    // Change 2: Update text (v3)
    engine.setTextOverride(
      {
        elementId: "test_elem",
        platform: "customer_app",
        route: "/",
        translations: { en: "Test" },
        visibility: "visible",
      },
      founderActor,
      "Test text"
    );
    expect(engine.getVersion()).toBe(3);

    // Rollback to v1
    const rollbackRes = engine.rollbackToVersion(1, founderActor, "Revert all test experiments");
    expect(rollbackRes.success).toBe(true);
    expect(rollbackRes.restoredVersion).toBe(1);
    expect(rollbackRes.newActiveVersion).toBe(4); // New sequential version

    // Verify v1 properties were completely restored
    expect(engine.getState().designTokens.palette.primary).toBe(v1State.designTokens.palette.primary);
    expect(engine.getState().textOverrides["test_elem"]).toBeUndefined();
  });

  it("generates CSS variables string and customer propagation payload with sha256 integrity", () => {
    const engine = new UniversalCustomizationEngine();
    const css = engine.generateCssVariables();

    expect(css).toContain("--color-primary: #E23744;");
    expect(css).toContain("--color-bg: #FCFAF7;");
    expect(css).toContain("--radius-md: 12px;");

    const payload = engine.exportCustomerPayload();
    expect(payload.version).toBe(1);
    expect(payload.sha256).toBeDefined();
    expect(payload.sha256.length).toBe(64);
    expect(payload.homeLayout?.pageId).toBe("customer_home");
  });
});
