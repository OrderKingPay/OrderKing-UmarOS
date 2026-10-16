import React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, beforeEach } from "vitest";
import {
  CustomizationProvider,
  DynamicSectionRenderer,
  DEFAULT_CUSTOMIZATION_STATE,
  injectCssVariables,
  useCustomization,
  useText,
  type DynamicCustomizationState,
  type LayoutSection,
} from "@orderking/ui";
import { homeSectionRegistry, HomeSectionFallback } from "@/components/sdui/home-sections";

const h = React.createElement;

describe("Customer App SDUI & Token Ingestion Integration Suite", () => {
  let mockElement: {
    style: {
      setProperty: (name: string, value: string) => void;
      getPropertyValue: (name: string) => string;
    };
  };
  let injectedProperties: Record<string, string>;

  beforeEach(() => {
    injectedProperties = {};
    mockElement = {
      style: {
        setProperty: (name: string, value: string) => {
          injectedProperties[name] = value;
        },
        getPropertyValue: (name: string) => injectedProperties[name] || "",
      },
    };
  });

  describe("1. Dynamic CSS Variables Injection on :root", () => {
    it("injects core brand and layout custom properties into target element", () => {
      const tokens = injectCssVariables(DEFAULT_CUSTOMIZATION_STATE, mockElement);

      // Verify core color tokens
      expect(tokens["--color-primary"]).toBe("#E23744");
      expect(tokens["--color-primary-fg"]).toBe("#FFFFFF");
      expect(tokens["--color-bg"]).toBe("#FCFAF7");
      expect(tokens["--color-surface"]).toBe("#FCFAF7");
      expect(tokens["--color-surface-2"]).toBe("#FFFFFF");
      expect(tokens["--color-fg"]).toBe("#1C1C1C");
      expect(tokens["--color-muted"]).toBe("#6B7280");
      expect(tokens["--color-danger"]).toBe("#EF4444");
      expect(tokens["--color-success"]).toBe("#24963F");
      expect(tokens["--color-warn"]).toBe("#F59E0B");

      // Verify shorthand variables for direct element styling
      expect(tokens["--primary"]).toBe("#E23744");
      expect(tokens["--bg"]).toBe("#FCFAF7");
      expect(tokens["--fg"]).toBe("#1C1C1C");
      expect(tokens["--radius-md"]).toBe("12px");
      expect(tokens["--radius"]).toBe("12px");

      // Verify DOM element received the injected properties
      expect(injectedProperties["--color-primary"]).toBe("#E23744");
      expect(injectedProperties["--color-bg"]).toBe("#FCFAF7");
      expect(injectedProperties["--radius-md"]).toBe("12px");
    });

    it("reacts live to festive or brand token updates from UmarOS", () => {
      const festiveCustomization: Partial<DynamicCustomizationState> = {
        version: 2,
        designTokens: {
          palette: {
            primary: "#FFB800", // Festive Gold
            primaryForeground: "#000000",
            background: "#18181B", // Dark Festive Background
            surface: "#27272A",
            foreground: "#FFFFFF",
            muted: "#A1A1AA",
            accent: "#F59E0B",
            border: "#3F3F46",
          },
          radius: {
            xsPx: 4,
            smPx: 8,
            mdPx: 16,
            lgPx: 24,
            full: true,
          },
        },
      };

      const tokens = injectCssVariables(festiveCustomization, mockElement);

      expect(tokens["--color-primary"]).toBe("#FFB800");
      expect(tokens["--color-bg"]).toBe("#18181B");
      expect(tokens["--radius-md"]).toBe("16px");
      expect(tokens["--radius-lg"]).toBe("24px");
      expect(tokens["--radius-full"]).toBe("9999px");

      expect(injectedProperties["--color-primary"]).toBe("#FFB800");
      expect(injectedProperties["--color-bg"]).toBe("#18181B");
    });
  });

  describe("2. CustomizationProvider Integration & Component Reactivity", () => {
    function CustomTokenWatcher() {
      const { designTokens } = useCustomization();
      return h(
        "div",
        {
          "data-testid": "watcher",
          "data-primary": designTokens.palette.primary,
          "data-bg": designTokens.palette.background,
        },
        `Primary: ${designTokens.palette.primary}`
      );
    }

    it("provides dynamic customization context across child components", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(CustomTokenWatcher, null)
        )
      );

      expect(html).toContain('data-primary="#E23744"');
      expect(html).toContain("Primary: #E23744");
    });

    it("resolves multi-lingual localized text overrides", () => {
      function LocalizedHero() {
        const title = useText("customer.home.hero_title", "Fallback Hero");
        return h("h1", null, title);
      }

      const hindiHtml = renderToString(
        h(
          CustomizationProvider,
          { locale: "hi", disableCssInjection: true },
          h(LocalizedHero, null)
        )
      );

      expect(hindiHtml).toContain("मिनटों में खाना और आवश्यक वस्तुएं ऑर्डर करें");
    });
  });

  describe("3. Server-Driven UI (SDUI) & DynamicSectionRenderer on Home Route", () => {
    // Isolated headless registry for testing SDUI ordering and manifest compliance
    const sduiTestRegistry = {
      location_picker: ({ section }: { section: LayoutSection }) =>
        h("div", { "data-sdui-section": "location_picker" }, section.title),
      search_input: ({ section }: { section: LayoutSection }) =>
        h("div", { "data-sdui-section": "search_input" }, section.title),
      banner_carousel: ({ section }: { section: LayoutSection }) =>
        h("div", { "data-sdui-section": "banner_carousel" }, section.title),
      category_grid: ({ section }: { section: LayoutSection }) =>
        h("div", { "data-sdui-section": "category_grid" }, section.title),
      restaurant_feed: ({ section }: { section: LayoutSection }) =>
        h("div", { "data-sdui-section": "restaurant_feed" }, section.title),
      restaurant_list: ({ section }: { section: LayoutSection }) =>
        h("div", { "data-sdui-section": "restaurant_list" }, section.title),
    };

    it("renders canonical customer_home sections in exact ascending order", () => {
      const html = renderToString(
        h(
          CustomizationProvider,
          { disableCssInjection: true },
          h(DynamicSectionRenderer, {
            pageId: "customer_home",
            registry: sduiTestRegistry,
            fallback: HomeSectionFallback,
          })
        )
      );

      // Verify sections are mounted
      const locationIdx = html.indexOf('data-sdui-section="location_picker"');
      const searchIdx = html.indexOf('data-sdui-section="search_input"');
      const promoIdx = html.indexOf('data-sdui-section="banner_carousel"');
      const catIdx = html.indexOf('data-sdui-section="category_grid"');
      const restIdx = html.indexOf('data-sdui-section="restaurant_list"');

      expect(locationIdx).toBeGreaterThan(-1);
      expect(searchIdx).toBeGreaterThan(-1);
      expect(promoIdx).toBeGreaterThan(-1);
      expect(catIdx).toBeGreaterThan(-1);
      expect(restIdx).toBeGreaterThan(-1);

      // Verify ascending order by order manifest: location (1) -> search (2) -> promo (3) -> categories (4) -> restaurants (5)
      expect(searchIdx).toBeGreaterThan(locationIdx);
      expect(promoIdx).toBeGreaterThan(searchIdx);
      expect(catIdx).toBeGreaterThan(promoIdx);
      expect(restIdx).toBeGreaterThan(catIdx);
    });

    it("dynamically respects manifest section reordering from UmarOS", () => {
      const reorderedCustomization: Partial<DynamicCustomizationState> = {
        version: 5,
        pageLayouts: {
          customer_home: {
            pageId: "customer_home",
            sections: [
              {
                id: "promo_carousel",
                type: "banner_carousel",
                order: 1,
                visible: true,
              },
              {
                id: "top_categories",
                type: "category_grid",
                order: 2,
                visible: true,
              },
              {
                id: "search_bar",
                type: "search_input",
                order: 3,
                visible: true,
              },
            ],
          },
        },
      };

      const html = renderToString(
        h(
          CustomizationProvider,
          { state: reorderedCustomization, disableCssInjection: true },
          h(DynamicSectionRenderer, {
            pageId: "customer_home",
            registry: sduiTestRegistry,
            fallback: HomeSectionFallback,
          })
        )
      );

      const promoIdx = html.indexOf('data-sdui-section="banner_carousel"');
      const catIdx = html.indexOf('data-sdui-section="category_grid"');
      const searchIdx = html.indexOf('data-sdui-section="search_input"');

      expect(promoIdx).toBeLessThan(catIdx);
      expect(catIdx).toBeLessThan(searchIdx);
    });

    it("filters out hidden sections when visible is false", () => {
      const hiddenSectionState: Partial<DynamicCustomizationState> = {
        version: 6,
        pageLayouts: {
          customer_home: {
            pageId: "customer_home",
            sections: [
              {
                id: "promo_carousel",
                type: "banner_carousel",
                order: 1,
                visible: false, // Hidden
              },
              {
                id: "search_bar",
                type: "search_input",
                order: 2,
                visible: true,
              },
            ],
          },
        },
      };

      const html = renderToString(
        h(
          CustomizationProvider,
          { state: hiddenSectionState, disableCssInjection: true },
          h(DynamicSectionRenderer, {
            pageId: "customer_home",
            registry: sduiTestRegistry,
            fallback: HomeSectionFallback,
          })
        )
      );

      expect(html.includes('data-sdui-section="banner_carousel"')).toBe(false);
      expect(html.includes('data-sdui-section="search_input"')).toBe(true);
    });

    it("verifies homeSectionRegistry exports all 5 core section types and fallbacks", () => {
      expect(homeSectionRegistry.location_picker).toBeDefined();
      expect(homeSectionRegistry.search_input).toBeDefined();
      expect(homeSectionRegistry.banner_carousel).toBeDefined();
      expect(homeSectionRegistry.category_grid).toBeDefined();
      expect(homeSectionRegistry.restaurant_feed).toBeDefined();
      expect(homeSectionRegistry.restaurant_list).toBeDefined();
      expect(homeSectionRegistry.home_feed).toBeDefined();
    });
  });
});
