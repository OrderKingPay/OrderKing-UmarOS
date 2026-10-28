import { describe, it, expect } from "vitest";
import {
  createPhysicalCommercialKitchen,
  registerVirtualBrandStorefront,
  getVirtualKitchenUtilization,
  setVirtualBrandActiveStatus,
  generateVirtualBrandDispatchTicket,
  auditVirtualKitchenCluster,
  VirtualKitchenCapacityError,
  VirtualKitchenComplianceError,
  MAX_VIRTUAL_BRANDS_PER_KITCHEN,
  CCPA_MAX_PACKAGING_CHARGE_PAISE,
} from "@orderking/ui";
import { mapOrderToReceiptData } from "../lib/hardware/thermal-printer.ts";
import { buildEscPosKotBytes } from "../lib/printer/persistent-kot-printer.ts";

describe("Partner Multi-Brand Virtual Kitchen Multiplier Integration", () => {
  const refDate = new Date("2026-10-28T10:00:00.000Z");
  const assamFssai = "21824001001234"; // Valid Assam State FSSAI license (State code 18)
  const validExpiry = "2027-10-28";

  it("provisions a commercial cloud kitchen and scales up to 5 virtual brands with shared FSSAI", () => {
    const kitchen = createPhysicalCommercialKitchen(
      {
        kitchenId: "kitch_silchar_cloud_01",
        kitchenName: "OrderKing Cloud Kitchen Hub Silchar",
        legalEntityName: "Orderkingpay LLP",
        fssaiLicenseNumber: assamFssai,
        fssaiExpiryDate: validExpiry,
        gstin: "18AFXPH9838M1Z9",
        address: "Tarapur Railway Gate, Silchar",
        city: "Silchar",
        stateCode: "18",
        pincode: "788001",
        latitude: 24.8333,
        longitude: 92.7789,
      },
      refDate
    );

    expect(kitchen.maxVirtualBrands).toBe(5);
    expect(kitchen.virtualBrands).toHaveLength(0);

    // Brand 1: Royal Awadh Biryani
    const b1 = registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "Royal Awadh Biryani",
        slug: "royal-awadh-biryani",
        cuisineCategory: "BIRYANI",
        dietaryType: "NON_VEG",
        menuItemCount: 20,
        packagingChargeCapPaise: 3500,
      },
      refDate
    );
    expect(b1.fssaiLicenseNumber).toBe(assamFssai);

    // Brand 2: Punjab Grill House
    const b2 = registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "Punjab Grill House",
        slug: "punjab-grill-house",
        cuisineCategory: "NORTH_INDIAN",
        dietaryType: "MIXED",
        menuItemCount: 30,
      },
      refDate
    );
    expect(b2.fssaiLicenseNumber).toBe(assamFssai);

    // Brand 3: Smash Burger Club
    const b3 = registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "Smash Burger Club",
        slug: "smash-burger-club",
        cuisineCategory: "FAST_FOOD_BURGERS",
        dietaryType: "MIXED",
        menuItemCount: 16,
      },
      refDate
    );
    expect(b3.fssaiLicenseNumber).toBe(assamFssai);

    // Brand 4: The Golden Wok
    const b4 = registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "The Golden Wok",
        slug: "the-golden-wok",
        cuisineCategory: "CHINESE",
        dietaryType: "MIXED",
        menuItemCount: 22,
      },
      refDate
    );
    expect(b4.fssaiLicenseNumber).toBe(assamFssai);

    // Brand 5: Chai & Katta
    const b5 = registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "Chai & Katta",
        slug: "chai-and-katta",
        cuisineCategory: "BEVERAGES_CHAI",
        dietaryType: "VEG",
        menuItemCount: 14,
      },
      refDate
    );
    expect(b5.fssaiLicenseNumber).toBe(assamFssai);

    // Verify exactly 5 brands registered and cluster is at maximum capacity
    const utilization = getVirtualKitchenUtilization(kitchen);
    expect(utilization.registeredBrandCount).toBe(5);
    expect(utilization.availableSlots).toBe(0);
    expect(utilization.isAtCapacity).toBe(true);

    // Attempting to register 6th virtual brand must be blocked
    expect(() =>
      registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Overcapacity Brand",
          slug: "overcapacity-brand",
          cuisineCategory: "STREET_FOOD",
          dietaryType: "VEG",
        },
        refDate
      )
    ).toThrowError(VirtualKitchenCapacityError);
  });

  it("integrates virtual brand dispatch tickets with partner thermal printer ESC/POS engine", () => {
    const kitchen = createPhysicalCommercialKitchen(
      {
        kitchenId: "kitch_print_test",
        kitchenName: "Silchar Hub Kitchen",
        legalEntityName: "Orderkingpay LLP",
        fssaiLicenseNumber: assamFssai,
        fssaiExpiryDate: validExpiry,
        gstin: "18AFXPH9838M1Z9",
        address: "Tarapur, Silchar",
        city: "Silchar",
        stateCode: "18",
        pincode: "788001",
        latitude: 24.8333,
        longitude: 92.7789,
      },
      refDate
    );

    const brand = registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "Royal Awadh Biryani",
        slug: "royal-awadh-biryani",
        cuisineCategory: "BIRYANI",
        dietaryType: "NON_VEG",
      },
      refDate
    );

    const ticket = generateVirtualBrandDispatchTicket(
      kitchen,
      brand.brandId,
      {
        orderNumber: "OK-4001",
        orderType: "DELIVERY",
        customerArea: "Rangirkhari",
        items: [
          { name: "Mutton Dum Biryani", quantity: 1, unitPricePaise: 42000 },
          { name: "Firni", quantity: 2, unitPricePaise: 9000 },
        ],
        packagingPaise: 2500,
      },
      refDate
    );

    // Map ticket to partner receipt data
    const receiptData = mapOrderToReceiptData({
      restaurantName: `${brand.brandName} (${kitchen.kitchenName})`,
      orderNumber: ticket.orderNumber,
      orderType: ticket.orderType,
      customerArea: "Rangirkhari",
      items: ticket.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        pricePaise: it.lineTotalPaise,
      })),
      prices: {
        foodValuePaise: ticket.subtotalPaise,
        packingPaise: ticket.packagingPaise,
        taxPaise: ticket.foodGstPaise,
        customerTotalPaise: ticket.totalPaise,
      },
    });

    expect(receiptData.restaurantName).toContain("Royal Awadh Biryani");
    expect(receiptData.restaurantName).toContain("Silchar Hub Kitchen");
    expect(receiptData.totalPaise).toBe(ticket.totalPaise);

    // Verify ESC/POS binary bytecode generation
    const escposBytes = buildEscPosKotBytes(receiptData);
    expect(escposBytes).toBeInstanceOf(Uint8Array);
    expect(escposBytes.length).toBeGreaterThan(50);
  });

  it("certifies cluster compliance across FSSAI, capacity, and CCPA packaging caps", () => {
    const kitchen = createPhysicalCommercialKitchen(
      {
        kitchenId: "kitch_audit_cluster",
        kitchenName: "OrderKing Cloud Silchar",
        legalEntityName: "Orderkingpay LLP",
        fssaiLicenseNumber: assamFssai,
        fssaiExpiryDate: validExpiry,
        address: "Tarapur, Silchar",
        city: "Silchar",
        stateCode: "18",
        pincode: "788001",
        latitude: 24.8333,
        longitude: 92.7789,
      },
      refDate
    );

    registerVirtualBrandStorefront(
      kitchen,
      {
        brandName: "Cloud Biryani",
        slug: "cloud-biryani",
        cuisineCategory: "BIRYANI",
        dietaryType: "NON_VEG",
        packagingChargeCapPaise: 4000,
      },
      refDate
    );

    const audit = auditVirtualKitchenCluster(kitchen, refDate);
    expect(audit.isFullyCompliant).toBe(true);
    expect(audit.fssaiValid).toBe(true);
    expect(audit.capacityWithinLimit).toBe(true);
    expect(audit.complianceIssues).toHaveLength(0);
  });
});
