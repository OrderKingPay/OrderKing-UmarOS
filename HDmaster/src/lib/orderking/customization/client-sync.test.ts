import React from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_CUSTOMIZATION_STATE,
  DynamicCustomizationState,
  DynamicSectionRenderer,
  injectCssVariables,
  LayoutSection,
  useCustomization,
  useSectionLayout,
  useText,
  CustomizationProvider,
} from "@orderking/ui";
import {
  DEFAULT_UNIVERSAL_CUSTOMIZATION,
  UniversalCustomizationEngine,
} from "./universal-customization-engine";

const h = React.createElement;

describe("Cross-Platform Client Token Ingestion & SDUI Provider", () => {
  let mockElement: {
    style: {
      setProperty: (name: string, value: string) => void;
      getPropertyValue: (name: string) => string;
    };
  };
  let injectedStyles: Record<string, string>;

  beforeEach(() => {
    injectedStyles = {};
    mockElement = {
      style: {
        setProperty: (name: string, value: string) => {
          injectedStyles[name] = value;
        },
        getPropertyValue: (name: string) => injectedStyles[name] || "",
      },
    };
  });

  // ==========================================================================
  // 1. CSS TOKEN INGESTION & INJECTION
  // ==========================================================================
  describe("CSS Token Ingestion & Injection", () => {
    it("injects canonical color, radius, and shadow tokens into target element style", () => {
      const vars = injectCssVariables(DEFAULT_CUSTOMIZATION_STATE, mockElement);

      // Verify core color properties
      expect(vars["--color-primary"]).toBe("#E23744");
      expect(vars["--color-primary-fg"]).toBe("#FFFFFF");
      expect(vars["--color-bg"]).toBe("#FCFAF7");
      expect(vars["--color-surface"]).toBe("#FCFAF7");
      expect(vars["--color-surface-2"]).toBe("#FFFFFF");
      expect(vars["--color-fg"]).toBe("#1C1C1C");
      expect(vars["--color-muted"]).toBe("#6B7280");
      expect(vars["--color-subtle"]).toBe("#9CA3AF");
      expect(vars["--color-accent"]).toBe("#E23744");
      expect(vars["--color-border"]).toBe("#E5E7EB");
      expect(vars["--color-danger"]).toBe("#EF4444");
      expect(vars["--color-success"]).toBe("#24963F");
      expect(vars["--color-warn"]).toBe("#F59E0B");

      // Verify shorthand CSS variables for component ease
      expect(vars["--primary"]).toBe("#E23744");
      expect(vars["--bg"]).toBe("#FCFAF7");
      expect(vars["--fg"]).toBe("#1C1C1C");

      // Verify radius tokens formatted in px
      expect(vars["--radius-xs"]).toBe("4px");
      expect(vars["--radius-sm"]).toBe("8px");
      expect(vars["--radius-md"]).toBe("12px");
      expect(vars["--radius-lg"]).toBe("16px");
      expect(vars["--radius-xl"]).toBe("20px");
      expect(vars["--radius"]).toBe("12px");

      // Verify shadows
      expect(vars["--shadow-sm"]).toBeDefined();
      expect(vars["--shadow-md"]).toBeDefined();

      // Verify element style received all tokens
      expect(injectedStyles["--color-primary"]).toBe("#E23744");
      expect(injectedStyles["--color-bg"]).toBe("#FCFAF7");
      expect(injectedStyles["--radius-md"]).toBe("12px");
    });

    it("reacts instantly to live token updates from UmarOS (e.g. festive theme)", () => {
      const festiveState: Partial<DynamicCustomizationState> = {
        version: 2,
        designTokens: {
          palette: {
            primary: "#FF9900", // Festive Gold/Orange
            primaryForeground: "#000000",
            background: "#121212", // Dark Festive Theme
            surface: "#1E1E1E",
            surfaceElevated: "#2D2D2D",
            foreground: "#FFFFFF",
            muted: "#A0A0A0",
            subtle: "#707070",
            accent: "#FFD700",
            border: "#333333",
            danger: "#FF4D4F",
            success: "#52C41A",
            warn: "#FAAD14",
            card: "#1E1E1E",
          },
          radius: {
            xsPx: 6,
            smPx: 10,
            mdPx: 18,
            lgPx: 24,
            xlPx: 30,
            full: true,
          },
        },
      };

      const updatedVars = injectCssVariables(festiveState, mockElement);

      expect(updatedVars["--color-primary"]).toBe("#FF9900");
      expect(updatedVars["--color-bg"]).toBe("#121212");
      expect(updatedVars["--radius-md"]).toBe("18px");
      expect(updatedVars["--radius-lg"]).toBe("24px");
      expect(updatedVars["--radius-full"]).toBe("9999px");

      expect(injectedStyles["--color-primary"]).toBe("#FF9900");
      expect(injectedStyles["--color-bg"]).toBe("#121212");
      expect(injectedStyles["--radius-md"]).toBe("18px");
    });

    it("parses and applies raw CSS variables string provided in downstream payload", () => {
      const stateWithRawCss: Partial<DynamicCustomizationState> = {
        version: 3,
        cssVariables: `
          :root {
            --color-primary: #0052CC;
            --color-bg: #F4F5F7;
            --custom-brand-glow: 0 0 15px rgba(0, 82, 204, 0.5);
            --radius-md: 14px;
          }
        `,
      };

      const vars = injectCssVariables(stateWithRawCss, mockElement);
      expect(vars["--color-primary"]).toBe("#0052CC");
      expect(vars["--color-bg"]).toBe("#F4F5F7");
      expect(vars["--custom-brand-glow"]).toBe("0 0 15px rgba(0, 82, 204, 0.5)");
      expect(vars["--radius-md"]).toBe("14px");

      expect(injectedStyles["--custom-brand-glow"]).toBe("0 0 15px rgba(0, 82, 204, 0.5)");
    });

    it("safely handles SSR or headless environments without DOM elements", () => {
      // Must not throw even when targetElement is null and document is undefined
      expect(() => {
        const vars = injectCssVariables(DEFAULT_CUSTOMIZATION_STATE, null);
        expect(vars["--color-primary"]).toBe("#E23744");
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // 2. TEXT RESOLUTION & LOCALIZATION
  // ==========================================================================
  describe("Text Resolution & Localization (useText)", () => {
    function TextTestComponent({
      elementId,
      defaultText,
      locale,
    }: {
      elementId: string;
      defaultText?: string;
      locale?: string;
    }) {
      const text = useText(elementId, defaultText, locale);
      return h("span", { "data-testid": "resolved-text" }, text);
    }

    it("resolves English text for canonical element keys", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { locale: "en", disableCssInjection: true },
          h(TextTestComponent, { elementId: "customer.home.hero_title" })
        )
      );

      expect(html).toContain("Order Food &amp; Essentials In Minutes");
    });

    it("resolves Hindi ('hi') translation when locale is switched", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { locale: "hi", disableCssInjection: true },
          h(TextTestComponent, { elementId: "customer.home.hero_title" })
        )
      );

      expect(html).toContain("मिनटों में खाना और आवश्यक वस्तुएं ऑर्डर करें");
    });

    it("resolves Bengali ('bn') translation for checkout button", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { locale: "bn", disableCssInjection: true },
          h(TextTestComponent, { elementId: "customer.checkout.pay_button" })
        )
      );

      expect(html).toContain("এখন অর্ডার করুন");
    });

    it("resolves Assamese ('as') translation when requested", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { locale: "as", disableCssInjection: true },
          h(TextTestComponent, { elementId: "customer.home.hero_title" })
        )
      );

      expect(html).toContain("কেইমিনিটমানতে খাদ্য আৰু প্ৰয়োজনীয় বস্তু অৰ্ডাৰ কৰক");
    });

    it("gracefully falls back to English when translation for a locale is missing", () => {
      const customState: Partial<DynamicCustomizationState> = {
        version: 1,
        textOverrides: {
          "custom.badge.text": {
            elementId: "custom.badge.text",
            translations: {
              en: "Super Fast Delivery",
            },
          },
        },
      };

      const html = renderToString(
        h(
          CustomizationProvider,
          { state: customState, locale: "hi", disableCssInjection: true },
          h(TextTestComponent, { elementId: "custom.badge.text" })
        )
      );

      // Hindi translation was not provided, so English fallback is used
      expect(html).toContain("Super Fast Delivery");
    });

    it("falls back to caller defaultText when elementId is not in overrides", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(TextTestComponent, {
            elementId: "unknown.unregistered.key",
            defaultText: "Default Button Label",
          })
        )
      );

      expect(html).toContain("Default Button Label");
    });

    it("falls back to elementId when neither translation nor defaultText is provided", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(TextTestComponent, { elementId: "customer.cart.empty_message" })
        )
      );

      expect(html).toContain("customer.cart.empty_message");
    });

    it("handles plain string overrides seamlessly", () => {
      const stateWithPlainStrings: Partial<DynamicCustomizationState> = {
        version: 2,
        textOverrides: {
          "plain.text.key": "Pure String Content",
        },
      };

      const html = renderToString(
        h(
          CustomizationProvider,
          { state: stateWithPlainStrings, disableCssInjection: true },
          h(TextTestComponent, { elementId: "plain.text.key" })
        )
      );

      expect(html).toContain("Pure String Content");
    });
  });

  // ==========================================================================
  // 3. SERVER-DRIVEN UI (SDUI) & SECTION ORDERING
  // ==========================================================================
  describe("Server-Driven UI & DynamicSectionRenderer", () => {
    const registry = {
      location_picker: ({ section }: { section: LayoutSection }) =>
        h("div", { className: "location-box" }, section.title),
      search_input: ({ placeholder }: { placeholder?: string }) =>
        h("input", { className: "search-box", placeholder }),
      banner_carousel: ({ title, autoplay }: { title?: string; autoplay?: boolean }) =>
        h("div", { className: "banner-box", "data-autoplay": String(autoplay) }, title),
      category_grid: ({ section }: { section: LayoutSection }) =>
        h("div", { className: "category-box" }, section.title),
      restaurant_list: ({ section }: { section: LayoutSection }) =>
        h("div", { className: "restaurant-box" }, section.title),
    };

    it("renders sections in exact ascending order by section.order", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(DynamicSectionRenderer, { pageId: "customer_home", registry })
        )
      );

      // Verify all 5 canonical sections exist in order
      const locIndex = html.indexOf('data-section-id="header_location"');
      const searchIndex = html.indexOf('data-section-id="search_bar"');
      const promoIndex = html.indexOf('data-section-id="promo_carousel"');
      const catIndex = html.indexOf('data-section-id="top_categories"');
      const restIndex = html.indexOf('data-section-id="restaurant_feed"');

      expect(locIndex).toBeGreaterThan(-1);
      expect(searchIndex).toBeGreaterThan(locIndex);
      expect(promoIndex).toBeGreaterThan(searchIndex);
      expect(catIndex).toBeGreaterThan(promoIndex);
      expect(restIndex).toBeGreaterThan(catIndex);
    });

    it("dynamically reorders sections when layout configuration is updated", () => {
      // Reorder: promo_carousel at order 1, search_bar at order 2, header_location at order 3
      const reorderedSections: LayoutSection[] = [
        {
          id: "promo_carousel",
          type: "banner_carousel",
          title: "Special Festive Offers",
          order: 1,
          visible: true,
          props: { autoplay: true },
        },
        {
          id: "search_bar",
          type: "search_input",
          title: "Search Dishes",
          order: 2,
          visible: true,
          props: { placeholder: "Search Biryani..." },
        },
        {
          id: "header_location",
          type: "location_picker",
          title: "Deliver To Guwahati",
          order: 3,
          visible: true,
        },
      ];

      const customState: Partial<DynamicCustomizationState> = {
        version: 10,
        pageLayouts: {
          customer_home: {
            pageId: "customer_home",
            sections: reorderedSections,
          },
        },
      };

      const html = renderToString(
        h(
          CustomizationProvider,
          { state: customState, disableCssInjection: true },
          h(DynamicSectionRenderer, { pageId: "customer_home", registry })
        )
      );

      const promoIndex = html.indexOf('data-section-id="promo_carousel"');
      const searchIndex = html.indexOf('data-section-id="search_bar"');
      const locIndex = html.indexOf('data-section-id="header_location"');

      expect(promoIndex).toBeLessThan(searchIndex);
      expect(searchIndex).toBeLessThan(locIndex);
    });

    it("filters out invisible sections (visible: false)", () => {
      const sectionsWithHidden: LayoutSection[] = [
        {
          id: "visible_sec",
          type: "location_picker",
          title: "Active Location",
          order: 1,
          visible: true,
        },
        {
          id: "hidden_sec",
          type: "banner_carousel",
          title: "Hidden Promo",
          order: 2,
          visible: false,
        },
      ];

      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(DynamicSectionRenderer, { sections: sectionsWithHidden, registry })
        )
      );

      expect(html).toContain('data-section-id="visible_sec"');
      expect(html).not.toContain('data-section-id="hidden_sec"');
    });

    it("applies responsive hiding classes and margin/padding styles correctly", () => {
      const responsiveSection: LayoutSection[] = [
        {
          id: "desktop_banner",
          type: "banner_carousel",
          title: "Desktop Banner",
          order: 1,
          visible: true,
          width: "90%",
          minHeightPx: 250,
          margin: { topPx: 16, bottomPx: 24, leftPx: 0, rightPx: 0 },
          padding: { topPx: 8, bottomPx: 8, leftPx: 16, rightPx: 16 },
          responsive: {
            hideOnMobile: true,
            hideOnTablet: false,
            hideOnDesktop: false,
          },
        },
      ];

      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(DynamicSectionRenderer, { sections: responsiveSection, registry })
        )
      );

      // Verify mobile hide class
      expect(html).toContain("max-sm:hidden");
      // Verify style attributes
      expect(html).toContain("width:90%");
      expect(html).toContain("min-height:250px");
      expect(html).toContain("margin-top:16px");
      expect(html).toContain("margin-bottom:24px");
    });

    it("renders fallback component when section type is not registered", () => {
      const unknownSection: LayoutSection[] = [
        {
          id: "mystery_section",
          type: "unregistered_custom_widget",
          title: "Mystery Widget",
          order: 1,
          visible: true,
        },
      ];

      function FallbackComponent({ section }: { section: LayoutSection }) {
        return h("div", { className: "fallback-alert" }, `Unregistered type: ${section.type}`);
      }

      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(DynamicSectionRenderer, {
            sections: unknownSection,
            registry,
            fallback: FallbackComponent,
          })
        )
      );

      expect(html).toContain("Unregistered type: unregistered_custom_widget");
    });
  });

  // ==========================================================================
  // 4. END-TO-END UMAROS ENGINE INTEGRATION
  // ==========================================================================
  describe("End-to-End UmarOS Engine Live Ingestion", () => {
    it("seamlessly consumes downstream payload from UniversalCustomizationEngine", () => {
      const founderActor = {
        userId: "founder_umar_01",
        role: "SUPREME_FOUNDER",
        name: "Founder Umar",
      };

      const engine = new UniversalCustomizationEngine();

      // 1. Update palette primary color in UmarOS
      engine.updatePaletteColor("primary", "#10B981", founderActor, "Switch to Emerald Green");

      // 2. Add high-priority localized text override
      engine.setTextOverride(
        {
          elementId: "customer.hero.announcement",
          platform: "customer_app",
          route: "/",
          translations: {
            en: "Guwahati Super Delivery Launched!",
            hi: "गुवाहाटी सुपर डिलीवरी शुरू हुई!",
            bn: "গুয়াহাটি সুপার ডেলিভারি চালু হয়েছে!",
            as: "গুৱাহাটী ছুপাৰ ডেলিভাৰী আৰম্ভ হ'ল!",
          },
        },
        founderActor,
        "Launch announcement in Northeast India"
      );

      // 3. Reorder home sections
      engine.reorderSections(
        "customer_home",
        ["promo_carousel", "search_bar", "header_location", "top_categories", "restaurant_feed"],
        founderActor,
        "Prioritize promo carousel on launch day"
      );

      // 4. Export downstream payload
      const customerPayload = engine.exportCustomerPayload();
      expect(customerPayload.version).toBeGreaterThan(1);
      expect(customerPayload.sha256).toBeDefined();

      // 5. Ingest into client CustomizationProvider & test CSS injection
      const injected = injectCssVariables(customerPayload, mockElement);
      expect(injected["--color-primary"]).toBe("#10B981");
      expect(injectedStyles["--color-primary"]).toBe("#10B981");

      // 6. Test text resolution in Assamese from the ingested payload
      function AnnouncementBanner() {
        const text = useText("customer.hero.announcement", "Default Promo", "as");
        return h("h1", null, text);
      }

      const textHtml = renderToString(
        h(
          CustomizationProvider,
          { state: customerPayload, disableCssInjection: true },
          h(AnnouncementBanner, null)
        )
      );
      expect(textHtml).toContain("গুৱাহাটী ছুপাৰ ডেলিভাৰী আৰম্ভ হ&#x27;ল!");

      // 7. Test SDUI rendering from the ingested payload
      const sduiRegistry = {
        promo_carousel: () => h("div", { className: "promo-item" }, "Promo"),
        search_input: () => h("div", { className: "search-item" }, "Search"),
        location_picker: () => h("div", { className: "loc-item" }, "Location"),
        category_grid: () => h("div", { className: "cat-item" }, "Categories"),
        restaurant_list: () => h("div", { className: "rest-item" }, "Restaurants"),
      };

      const sduiHtml = renderToString(
        h(
          CustomizationProvider,
          { state: customerPayload, disableCssInjection: true },
          h(DynamicSectionRenderer, { pageId: "customer_home", registry: sduiRegistry })
        )
      );

      // Verify promo_carousel is now first, before search_bar and location_picker
      const promoPos = sduiHtml.indexOf('data-section-id="promo_carousel"');
      const searchPos = sduiHtml.indexOf('data-section-id="search_bar"');
      const locPos = sduiHtml.indexOf('data-section-id="header_location"');

      expect(promoPos).toBeLessThan(searchPos);
      expect(searchPos).toBeLessThan(locPos);
    });
  });
});
