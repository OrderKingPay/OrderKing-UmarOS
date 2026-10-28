import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
  type PhysicalCommercialKitchen,
} from "./virtual-kitchen.ts";

describe("Multi-Brand Virtual Kitchen Multiplier Engine (packages/ui/src/virtual-kitchen.ts)", () => {
  // Test reference date: 2026-10-28
  const testRefDate = new Date("2026-10-28T10:00:00.000Z");

  // Valid 14-digit FSSAI license in Assam (State Code 18)
  const validAssamFssai = "21824001001234";
  const validExpiryDate = "2027-10-28"; // 1 year valid
  const expiredExpiryDate = "2026-09-01"; // Expired 2 months ago

  describe("createPhysicalCommercialKitchen", () => {
    it("provisions a valid physical commercial kitchen with 14-digit FSSAI and capacity 5", () => {
      const kitchen = createPhysicalCommercialKitchen(
        {
          kitchenId: "kitch_assam_01",
          kitchenName: "OrderKing Central Kitchen Guwahati",
          legalEntityName: "Orderkingpay Private Limited",
          fssaiLicenseNumber: validAssamFssai,
          fssaiExpiryDate: validExpiryDate,
          gstin: "18AFXPH9838M1Z9",
          address: "GS Road, Christian Basti",
          city: "Guwahati",
          stateCode: "18",
          pincode: "781005",
          latitude: 26.1584,
          longitude: 91.7712,
        },
        testRefDate
      );

      assert.strictEqual(kitchen.kitchenId, "kitch_assam_01");
      assert.strictEqual(kitchen.fssaiLicenseNumber, validAssamFssai);
      assert.strictEqual(kitchen.maxVirtualBrands, 5);
      assert.strictEqual(kitchen.virtualBrands.length, 0);
      assert.strictEqual(kitchen.isActive, true);
    });

    it("rejects invalid 14-digit FSSAI registration structure", () => {
      assert.throws(
        () =>
          createPhysicalCommercialKitchen(
            {
              kitchenId: "kitch_bad_fssai",
              kitchenName: "Bad FSSAI Kitchen",
              legalEntityName: "Bad Entity Ltd",
              fssaiLicenseNumber: "1234567890", // Only 10 digits
              fssaiExpiryDate: validExpiryDate,
              address: "Main Road",
              city: "Guwahati",
              stateCode: "18",
              pincode: "781005",
              latitude: 26.1584,
              longitude: 91.7712,
            },
            testRefDate
          ),
        (err: unknown) => {
          assert.ok(err instanceof VirtualKitchenComplianceError);
          assert.strictEqual(err.code, "INVALID_FSSAI_LICENSE");
          return true;
        }
      );
    });

    it("rejects commercial kitchen with expired FSSAI license", () => {
      assert.throws(
        () =>
          createPhysicalCommercialKitchen(
            {
              kitchenId: "kitch_expired",
              kitchenName: "Expired Kitchen",
              legalEntityName: "Expired Entity Ltd",
              fssaiLicenseNumber: validAssamFssai,
              fssaiExpiryDate: expiredExpiryDate,
              address: "Main Road",
              city: "Guwahati",
              stateCode: "18",
              pincode: "781005",
              latitude: 26.1584,
              longitude: 91.7712,
            },
            testRefDate
          ),
        (err: unknown) => {
          assert.ok(err instanceof VirtualKitchenComplianceError);
          assert.strictEqual(err.code, "FSSAI_LICENSE_EXPIRED");
          return true;
        }
      );
    });

    it("rejects invalid Indian pincode", () => {
      assert.throws(
        () =>
          createPhysicalCommercialKitchen(
            {
              kitchenId: "kitch_bad_pin",
              kitchenName: "Bad Pin Kitchen",
              legalEntityName: "Bad Pin Ltd",
              fssaiLicenseNumber: validAssamFssai,
              fssaiExpiryDate: validExpiryDate,
              address: "Main Road",
              city: "Guwahati",
              stateCode: "18",
              pincode: "081005", // Cannot start with 0
              latitude: 26.1584,
              longitude: 91.7712,
            },
            testRefDate
          ),
        (err: unknown) => {
          assert.ok(err instanceof VirtualKitchenComplianceError);
          assert.strictEqual(err.code, "INVALID_PINCODE");
          return true;
        }
      );
    });
  });

  describe("Virtual Brand Multiplier (1 Kitchen -> Up to 5 Virtual Brands)", () => {
    function setupKitchen(): PhysicalCommercialKitchen {
      return createPhysicalCommercialKitchen(
        {
          kitchenId: "kitch_cloud_01",
          kitchenName: "OrderKing Cloud Hub Silchar",
          legalEntityName: "Orderkingpay LLP",
          fssaiLicenseNumber: validAssamFssai,
          fssaiExpiryDate: validExpiryDate,
          gstin: "18AFXPH9838M1Z9",
          address: "Club Road, Tarapur",
          city: "Silchar",
          stateCode: "18",
          pincode: "788001",
          latitude: 24.8333,
          longitude: 92.7789,
        },
        testRefDate
      );
    }

    it("successfully registers up to 5 distinct virtual brand storefronts sharing 1 FSSAI license", () => {
      const kitchen = setupKitchen();

      // Brand 1: Cloud Biryani Co
      const b1 = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Cloud Biryani Co",
          slug: "cloud-biryani-co",
          cuisineCategory: "BIRYANI",
          dietaryType: "NON_VEG",
          menuItemCount: 18,
          packagingChargeCapPaise: 4000, // ₹40
        },
        testRefDate
      );
      assert.strictEqual(b1.brandName, "Cloud Biryani Co");
      assert.strictEqual(b1.fssaiLicenseNumber, validAssamFssai); // Strictly inherited!
      assert.strictEqual(kitchen.virtualBrands.length, 1);

      // Brand 2: Tandoor Express
      const b2 = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Tandoor Express",
          slug: "tandoor-express",
          cuisineCategory: "NORTH_INDIAN",
          dietaryType: "MIXED",
          menuItemCount: 24,
        },
        testRefDate
      );
      assert.strictEqual(b2.fssaiLicenseNumber, validAssamFssai);
      assert.strictEqual(kitchen.virtualBrands.length, 2);

      // Brand 3: Burger Craft
      const b3 = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Burger Craft",
          slug: "burger-craft",
          cuisineCategory: "FAST_FOOD_BURGERS",
          dietaryType: "MIXED",
          menuItemCount: 15,
        },
        testRefDate
      );
      assert.strictEqual(b3.fssaiLicenseNumber, validAssamFssai);
      assert.strictEqual(kitchen.virtualBrands.length, 3);

      // Brand 4: Chai & Bites
      const b4 = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Chai & Bites",
          slug: "chai-and-bites",
          cuisineCategory: "BEVERAGES_CHAI",
          dietaryType: "VEG",
          menuItemCount: 12,
        },
        testRefDate
      );
      assert.strictEqual(b4.fssaiLicenseNumber, validAssamFssai);
      assert.strictEqual(kitchen.virtualBrands.length, 4);

      // Brand 5: Sweet Sovereign
      const b5 = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Sweet Sovereign",
          slug: "sweet-sovereign",
          cuisineCategory: "BAKERY_DESSERTS",
          dietaryType: "EGG",
          menuItemCount: 10,
        },
        testRefDate
      );
      assert.strictEqual(b5.fssaiLicenseNumber, validAssamFssai);
      assert.strictEqual(kitchen.virtualBrands.length, 5);

      // Verify utilization metrics at maximum capacity
      const utilization = getVirtualKitchenUtilization(kitchen);
      assert.strictEqual(utilization.totalCapacity, 5);
      assert.strictEqual(utilization.registeredBrandCount, 5);
      assert.strictEqual(utilization.availableSlots, 0);
      assert.strictEqual(utilization.isAtCapacity, true);
    });

    it("STRICTLY BLOCKS 6th virtual brand registration with statutory capacity error", () => {
      const kitchen = setupKitchen();

      // Register 5 brands to hit statutory ceiling
      const brands = [
        { name: "Brand 1", slug: "brand-1", cuisine: "BIRYANI" as const },
        { name: "Brand 2", slug: "brand-2", cuisine: "NORTH_INDIAN" as const },
        { name: "Brand 3", slug: "brand-3", cuisine: "CHINESE" as const },
        { name: "Brand 4", slug: "brand-4", cuisine: "PIZZA_PASTA" as const },
        { name: "Brand 5", slug: "brand-5", cuisine: "STREET_FOOD" as const },
      ];

      for (const b of brands) {
        registerVirtualBrandStorefront(
          kitchen,
          {
            brandName: b.name,
            slug: b.slug,
            cuisineCategory: b.cuisine,
            dietaryType: "MIXED",
          },
          testRefDate
        );
      }

      assert.strictEqual(kitchen.virtualBrands.length, 5);

      // Attempting to register Brand 6 MUST THROW VirtualKitchenCapacityError
      assert.throws(
        () =>
          registerVirtualBrandStorefront(
            kitchen,
            {
              brandName: "Brand 6 Overflow",
              slug: "brand-6-overflow",
              cuisineCategory: "MUGHLAI",
              dietaryType: "NON_VEG",
            },
            testRefDate
          ),
        (err: unknown) => {
          assert.ok(err instanceof VirtualKitchenCapacityError);
          assert.strictEqual(err.code, "VIRTUAL_KITCHEN_CAPACITY_EXCEEDED");
          assert.strictEqual(err.currentCount, 5);
          assert.strictEqual(err.maxCapacity, MAX_VIRTUAL_BRANDS_PER_KITCHEN);
          return true;
        }
      );
    });

    it("rejects duplicate slug registration within the same commercial kitchen", () => {
      const kitchen = setupKitchen();

      registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Biryani Express",
          slug: "biryani-express",
          cuisineCategory: "BIRYANI",
          dietaryType: "NON_VEG",
        },
        testRefDate
      );

      assert.throws(
        () =>
          registerVirtualBrandStorefront(
            kitchen,
            {
              brandName: "Biryani Express Second",
              slug: "biryani-express", // Duplicate!
              cuisineCategory: "BIRYANI",
              dietaryType: "NON_VEG",
            },
            testRefDate
          ),
        (err: unknown) => {
          assert.ok(err instanceof VirtualKitchenComplianceError);
          assert.strictEqual(err.code, "DUPLICATE_BRAND_SLUG");
          return true;
        }
      );
    });

    it("caps packaging charge at CCPA statutory limit of ₹50 (5000 paise)", () => {
      const kitchen = setupKitchen();

      const brand = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Luxury Burger Co",
          slug: "luxury-burger-co",
          cuisineCategory: "FAST_FOOD_BURGERS",
          dietaryType: "MIXED",
          packagingChargeCapPaise: 9900, // Attempting ₹99 packaging fee
        },
        testRefDate
      );

      // Must be automatically clamped to CCPA_MAX_PACKAGING_CHARGE_PAISE (₹50)
      assert.strictEqual(brand.packagingChargeCapPaise, CCPA_MAX_PACKAGING_CHARGE_PAISE);
    });

    it("toggles virtual brand active status and honors kitchen FSSAI validity", () => {
      const kitchen = setupKitchen();

      const brand = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Noodle Works",
          slug: "noodle-works",
          cuisineCategory: "CHINESE",
          dietaryType: "MIXED",
        },
        testRefDate
      );

      assert.strictEqual(brand.active, true);

      // Pause brand
      setVirtualBrandActiveStatus(kitchen, brand.brandId, false, testRefDate);
      assert.strictEqual(brand.active, false);

      // Resume brand
      setVirtualBrandActiveStatus(kitchen, brand.brandId, true, testRefDate);
      assert.strictEqual(brand.active, true);
    });
  });

  describe("KDS Ticket Generation & Statutory Food Safety Disclosure", () => {
    it("generates authentic KOT ticket with shared FSSAI, brand demarcation, and Sec 9(5) CGST", () => {
      const kitchen = createPhysicalCommercialKitchen(
        {
          kitchenId: "kitch_kds_01",
          kitchenName: "OrderKing Master Cloud Hub",
          legalEntityName: "Orderkingpay Pvt Ltd",
          fssaiLicenseNumber: validAssamFssai,
          fssaiExpiryDate: validExpiryDate,
          gstin: "18AFXPH9838M1Z9",
          address: "Janata Bhawan Path, Dispur",
          city: "Guwahati",
          stateCode: "18",
          pincode: "781006",
          latitude: 26.1433,
          longitude: 91.7898,
        },
        testRefDate
      );

      const brand = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Cloud Biryani Co",
          slug: "cloud-biryani-co",
          cuisineCategory: "BIRYANI",
          dietaryType: "NON_VEG",
          packagingChargeCapPaise: 3000, // ₹30 cap
        },
        testRefDate
      );

      const ticket = generateVirtualBrandDispatchTicket(
        kitchen,
        brand.brandId,
        {
          orderNumber: "OK-7841",
          orderType: "DELIVERY",
          customerArea: "Beltola Tiniali",
          items: [
            {
              name: "Kolkata Dum Biryani (Chicken)",
              quantity: 2,
              unitPricePaise: 28000, // ₹280.00
              specialInstructions: "Extra Aloo, Medium Spicy",
            },
            {
              name: "Burani Raita",
              quantity: 1,
              unitPricePaise: 5000, // ₹50.00
            },
          ],
          packagingPaise: 3000, // ₹30.00
        },
        testRefDate
      );

      // Subtotal: 2 * 28000 + 1 * 5000 = 56000 + 5000 = 61000 paise (₹610.00)
      assert.strictEqual(ticket.subtotalPaise, 61000);
      assert.strictEqual(ticket.packagingPaise, 3000);

      // Taxable: 61000 + 3000 = 64000 paise.
      // Sec 9(5) Food GST 5% on 64000 = 3200 paise (₹32.00)
      assert.strictEqual(ticket.foodGstPaise, 3200);

      // Grand Total: 64000 + 3200 = 67200 paise (₹672.00)
      assert.strictEqual(ticket.totalPaise, 67200);

      // Verification of statutory disclosures
      assert.strictEqual(ticket.fssaiLicenseNumber, validAssamFssai);
      assert.strictEqual(ticket.brandName, "Cloud Biryani Co");
      assert.strictEqual(ticket.kitchenName, "OrderKing Master Cloud Hub");
      assert.ok(ticket.statutoryDisclosure.includes(`FSSAI Lic. No. ${validAssamFssai}`));
      assert.ok(ticket.statutoryDisclosure.includes("Janata Bhawan Path, Dispur"));

      // ASCII Ticket layout verification
      assert.ok(ticket.asciiTicket.includes("VIRTUAL BRAND: CLOUD BIRYANI CO"));
      assert.ok(ticket.asciiTicket.includes("COMMERCIAL KITCHEN: OrderKing Master Cloud Hub"));
      assert.ok(ticket.asciiTicket.includes(`Lic. No. : ${validAssamFssai}`));
      assert.ok(ticket.asciiTicket.includes("Kolkata Dum Biryani (Chicken)"));
      assert.ok(ticket.asciiTicket.includes("Extra Aloo, Medium Spicy"));
    });

    it("blocks dispatch ticket generation if virtual brand is paused or inactive", () => {
      const kitchen = createPhysicalCommercialKitchen(
        {
          kitchenId: "kitch_paused_brand",
          kitchenName: "Test Kitchen",
          legalEntityName: "Test Corp",
          fssaiLicenseNumber: validAssamFssai,
          fssaiExpiryDate: validExpiryDate,
          address: "Station Road",
          city: "Guwahati",
          stateCode: "18",
          pincode: "781001",
          latitude: 26.18,
          longitude: 91.74,
        },
        testRefDate
      );

      const brand = registerVirtualBrandStorefront(
        kitchen,
        {
          brandName: "Paused Brand",
          slug: "paused-brand",
          cuisineCategory: "STREET_FOOD",
          dietaryType: "VEG",
        },
        testRefDate
      );

      // Pause the brand
      setVirtualBrandActiveStatus(kitchen, brand.brandId, false, testRefDate);

      assert.throws(
        () =>
          generateVirtualBrandDispatchTicket(
            kitchen,
            brand.brandId,
            {
              orderNumber: "OK-0099",
              orderType: "TAKEAWAY",
              items: [{ name: "Samosa", quantity: 2, unitPricePaise: 2000 }],
            },
            testRefDate
          ),
        (err: unknown) => {
          assert.ok(err instanceof VirtualKitchenComplianceError);
          assert.strictEqual(err.code, "BRAND_INACTIVE");
          return true;
        }
      );
    });
  });

  describe("auditVirtualKitchenCluster", () => {
    it("certifies a fully compliant 5-brand virtual kitchen cluster", () => {
      const kitchen = createPhysicalCommercialKitchen(
        {
          kitchenId: "kitch_audit_pass",
          kitchenName: "Compliant Kitchen Hub",
          legalEntityName: "Compliant Foods Ltd",
          fssaiLicenseNumber: validAssamFssai,
          fssaiExpiryDate: validExpiryDate,
          address: "GNB Road, Ambari",
          city: "Guwahati",
          stateCode: "18",
          pincode: "781001",
          latitude: 26.188,
          longitude: 91.751,
        },
        testRefDate
      );

      const categories = [
        { name: "Brand 1", slug: "brand-1", cat: "BIRYANI" as const },
        { name: "Brand 2", slug: "brand-2", cat: "NORTH_INDIAN" as const },
        { name: "Brand 3", slug: "brand-3", cat: "CHINESE" as const },
        { name: "Brand 4", slug: "brand-4", cat: "PIZZA_PASTA" as const },
        { name: "Brand 5", slug: "brand-5", cat: "BAKERY_DESSERTS" as const },
      ];

      for (const b of categories) {
        registerVirtualBrandStorefront(
          kitchen,
          {
            brandName: b.name,
            slug: b.slug,
            cuisineCategory: b.cat,
            dietaryType: "MIXED",
          },
          testRefDate
        );
      }

      const audit = auditVirtualKitchenCluster(kitchen, testRefDate);
      assert.strictEqual(audit.isFullyCompliant, true);
      assert.strictEqual(audit.activeBrandsCount, 5);
      assert.strictEqual(audit.fssaiValid, true);
      assert.strictEqual(audit.capacityWithinLimit, true);
      assert.strictEqual(audit.complianceIssues.length, 0);
    });

    it("flags compliance failure if physical kitchen FSSAI is expired", () => {
      const kitchen = createPhysicalCommercialKitchen(
        {
          kitchenId: "kitch_audit_fail",
          kitchenName: "Soon Expired Kitchen",
          legalEntityName: "Foods Ltd",
          fssaiLicenseNumber: validAssamFssai,
          fssaiExpiryDate: "2026-11-01", // Valid on testRefDate (2026-10-28)
          address: "GNB Road",
          city: "Guwahati",
          stateCode: "18",
          pincode: "781001",
          latitude: 26.188,
          longitude: 91.751,
        },
        testRefDate
      );

      // Audit after expiry (e.g. 2026-11-15)
      const audit = auditVirtualKitchenCluster(kitchen, new Date("2026-11-15T00:00:00Z"));
      assert.strictEqual(audit.isFullyCompliant, false);
      assert.strictEqual(audit.fssaiValid, false);
      assert.ok(audit.complianceIssues.some((issue) => issue.includes("expired")));
    });
  });
});
