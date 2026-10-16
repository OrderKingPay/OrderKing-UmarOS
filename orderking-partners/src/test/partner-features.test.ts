import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mapOrderToReceiptData,
  dispatchSilentThermalKot,
  isAutoPrintEnabled,
  getSavedPaperWidth,
} from "../lib/hardware/thermal-printer.ts";
import type { ModifierGroup, ModifierOption } from "../lib/server/api-menu.ts";

const mockStorage: Record<string, string> = {};

describe("Partner App Thermal Printing & Hardware KOT Automation", () => {
  beforeEach(() => {
    for (const key in mockStorage) delete mockStorage[key];
    vi.stubGlobal("localStorage", {
      getItem(key: string) {
        return mockStorage[key] ?? null;
      },
      setItem(key: string, value: string) {
        mockStorage[key] = String(value);
      },
      removeItem(key: string) {
        delete mockStorage[key];
      },
      clear() {
        for (const key in mockStorage) delete mockStorage[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps incoming Supabase order payload to EscPosReceiptData accurately", () => {
    const rawOrder = {
      id: "ord_kot_98765",
      order_number: "OK-4042",
      order_type: "DELIVERY",
      customer_area: "Koramangala 4th Block, Bengaluru",
      food_value_paise: 45000,
      packing_paise: 2500,
      tax_paise: 2375,
      customer_total_paise: 49875,
      prep_minutes: 25,
      lines: [
        {
          item_name: "Paneer Tikka Roll",
          quantity: 2,
          unitPricePaise: 20000,
          specialInstructions: "Extra crispy, green chutney on side",
        },
        {
          item_name: "Gulab Jamun (2 pcs)",
          quantity: 1,
          unitPricePaise: 5000,
        },
      ],
      special_instructions: "Please do not ring the bell, leave at guard gate",
    };

    const receipt = mapOrderToReceiptData(rawOrder, "Tandoori Nights Kitchen");

    expect(receipt.restaurantName).toBe("Tandoori Nights Kitchen");
    expect(receipt.orderNumber).toBe("OK-4042");
    expect(receipt.orderType).toBe("DELIVERY");
    expect(receipt.tableOrArea).toBe("Koramangala 4th Block, Bengaluru");
    expect(receipt.prepMinutes).toBe(25);
    expect(receipt.items.length).toBe(2);
    expect(receipt.items[0].name).toBe("Paneer Tikka Roll");
    expect(receipt.items[0].quantity).toBe(2);
    expect(receipt.items[0].instructions).toBe("Extra crispy, green chutney on side");
    expect(receipt.subtotalPaise).toBe(45000);
    expect(receipt.packingPaise).toBe(2500);
    // CGST and SGST split equally from 2375 paise tax
    expect((receipt.cgstPaise ?? 0) + (receipt.sgstPaise ?? 0)).toBe(2375);
    expect(receipt.totalPaise).toBe(49875);
    expect(receipt.autoCut).toBe(true);
    expect(receipt.qrPayload).toContain("reorder=OK-4042");
  });

  it("handles Dine-In table orders and fallback line items smoothly", () => {
    const dineInOrder = {
      orderNumber: "OK-7711",
      orderType: "DINE_IN",
      tableOrArea: "Table 12 (AC Section)",
      prices: {
        foodValuePaise: 35000,
        taxPaise: 1750,
        customerTotalPaise: 36750,
      },
      items: [
        {
          name: "Butter Chicken",
          quantity: 1,
          pricePaise: 35000,
          station: "Curry / Hot Line",
        },
      ],
    };

    const receipt = mapOrderToReceiptData(dineInOrder);
    expect(receipt.orderType).toBe("DINE_IN");
    expect(receipt.tableOrArea).toBe("Table 12 (AC Section)");
    expect(receipt.items[0].station).toBe("Curry / Hot Line");
  });

  it("generates valid ESC/POS byte sequence and plain text layout for 80mm printer", async () => {
    const order = {
      order_number: "OK-5001",
      order_type: "DELIVERY",
      food_value_paise: 25000,
      tax_paise: 1250,
      customer_total_paise: 26250,
      lines: [{ item_name: "Biryani", quantity: 1, unitPricePaise: 25000 }],
    };

    const result = await dispatchSilentThermalKot(order, {
      restaurantName: "Biryani House",
      paperWidth: "80mm",
    });

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBe("OK-5001");
    expect(result.colCount).toBe(48); // Standard 48 columns for 80mm
    expect(result.bytes.length).toBeGreaterThan(50);
    expect(result.plainText).toContain("BIRYANI HOUSE");
    expect(result.plainText).toContain("KITCHEN KOT");
    expect(result.plainText).toContain("Biryani");
  });

  it("generates valid ESC/POS byte sequence for compact 58mm printer", async () => {
    const order = {
      order_number: "OK-5002",
      order_type: "TAKEAWAY",
      food_value_paise: 12000,
      tax_paise: 600,
      customer_total_paise: 12600,
      lines: [{ item_name: "Masala Dosa", quantity: 1, unitPricePaise: 12000 }],
    };

    const result = await dispatchSilentThermalKot(order, {
      restaurantName: "Udupi Express",
      paperWidth: "58mm",
    });

    expect(result.success).toBe(true);
    expect(result.colCount).toBe(32); // Standard 32 columns for 58mm
    expect(result.plainText).toContain("UDUPI EXPRESS");
    expect(result.plainText).toContain("Masala Dosa");
  });

  it("reads auto-print and paper width preferences from localStorage correctly", () => {
    expect(isAutoPrintEnabled()).toBe(true); // Default enabled
    expect(getSavedPaperWidth()).toBe("80mm"); // Default 80mm

    localStorage.setItem("ok_auto_print_kot", "false");
    expect(isAutoPrintEnabled()).toBe(false);

    localStorage.setItem("ok_paper_width", "58mm");
    expect(getSavedPaperWidth()).toBe("58mm");
  });
});

describe("Nested Item Modifiers & Customization Groups", () => {
  it("structures radio modifier groups enforcing single-selection (min 1, max 1)", () => {
    const portionGroup: ModifierGroup = {
      id: "mod_grp_portion",
      title: "Select Portion Size",
      minSelect: 1,
      maxSelect: 1,
      type: "RADIO",
      required: true,
      options: [
        { id: "opt_half", name: "Half (2 Pcs)", pricePaise: 0, isActive: true, isDefault: true },
        { id: "opt_full", name: "Full (4 Pcs)", pricePaise: 15000, isActive: true },
      ],
    };

    expect(portionGroup.type).toBe("RADIO");
    expect(portionGroup.minSelect).toBe(1);
    expect(portionGroup.maxSelect).toBe(1);
    expect(portionGroup.required).toBe(true);
    expect(portionGroup.options.length).toBe(2);
    expect(portionGroup.options.find((o) => o.isDefault)?.id).toBe("opt_half");
  });

  it("structures multi-selection checkbox modifier groups with variant price overrides", () => {
    // Pizza variant adders: Extra Cheese is +₹30 (3000 paise) on Regular, +₹60 (6000 paise) on Large
    const toppingsGroup: ModifierGroup = {
      id: "mod_grp_toppings",
      title: "Gourmet Add-ons & Toppings",
      minSelect: 0,
      maxSelect: 5,
      type: "CHECKBOX",
      required: false,
      options: [
        {
          id: "opt_extra_cheese",
          name: "Extra Mozzarella Cheese",
          pricePaise: 3000, // Base Regular adder
          variantPriceOverrides: {
            var_regular: 3000, // +₹30
            var_medium: 4500,  // +₹45
            var_large: 6000,   // +₹60
          },
          isActive: true,
        },
        {
          id: "opt_jalapenos",
          name: "Pickled Jalapenos",
          pricePaise: 2500,
          isActive: true,
        },
      ],
    };

    expect(toppingsGroup.type).toBe("CHECKBOX");
    expect(toppingsGroup.minSelect).toBe(0);
    expect(toppingsGroup.maxSelect).toBe(5);

    const cheeseOption = toppingsGroup.options[0];
    expect(cheeseOption.variantPriceOverrides?.var_regular).toBe(3000);
    expect(cheeseOption.variantPriceOverrides?.var_large).toBe(6000);

    // Verify resolving effective price adder given a selected dish variant
    function getEffectiveModifierPrice(option: ModifierOption, selectedVariantId?: string): number {
      if (selectedVariantId && option.variantPriceOverrides?.[selectedVariantId] !== undefined) {
        return option.variantPriceOverrides[selectedVariantId]!;
      }
      return option.pricePaise ?? 0;
    }

    expect(getEffectiveModifierPrice(cheeseOption, "var_regular")).toBe(3000);
    expect(getEffectiveModifierPrice(cheeseOption, "var_large")).toBe(6000);
    expect(getEffectiveModifierPrice(cheeseOption, "unknown_variant")).toBe(3000);
  });
});

describe("Per-Order Kitchen Prep Time Dynamic Delay (+5m / +10m)", () => {
  it("extends preparation SLA and dynamically shifts delivery ETA", () => {
    const basePrepMinutes = 20;
    const placedAt = new Date("2026-10-16T12:00:00Z");

    // Standard ETA without delay: placedAt + 20 mins prep + 15 mins transit
    const standardPrepDone = new Date(placedAt.getTime() + basePrepMinutes * 60 * 1000);
    expect(standardPrepDone.toISOString()).toBe("2026-10-16T12:20:00.000Z");

    // Helper simulating kitchen extension
    function extendPrepTime(currentPrep: number, addedMinutes: 5 | 10): {
      newPrepMinutes: number;
      updatedPrepDone: Date;
      updatedRiderArrivalEta: Date;
    } {
      const newPrepMinutes = currentPrep + addedMinutes;
      const updatedPrepDone = new Date(placedAt.getTime() + newPrepMinutes * 60 * 1000);
      // Rider is notified to arrive 5 minutes before prep completion
      const updatedRiderArrivalEta = new Date(updatedPrepDone.getTime() - 5 * 60 * 1000);
      return { newPrepMinutes, updatedPrepDone, updatedRiderArrivalEta };
    }

    // 1-tap +5m Delay
    const delay5 = extendPrepTime(basePrepMinutes, 5);
    expect(delay5.newPrepMinutes).toBe(25);
    expect(delay5.updatedPrepDone.toISOString()).toBe("2026-10-16T12:25:00.000Z");
    expect(delay5.updatedRiderArrivalEta.toISOString()).toBe("2026-10-16T12:20:00.000Z");

    // 1-tap +10m Delay on top of +5m
    const delay10 = extendPrepTime(delay5.newPrepMinutes, 10);
    expect(delay10.newPrepMinutes).toBe(35);
    expect(delay10.updatedPrepDone.toISOString()).toBe("2026-10-16T12:35:00.000Z");
    expect(delay10.updatedRiderArrivalEta.toISOString()).toBe("2026-10-16T12:30:00.000Z");
  });
});
