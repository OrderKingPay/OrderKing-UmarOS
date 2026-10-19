import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateFssaiNumber,
  parseFssaiNumber,
  calculateFssaiExpiryStatus,
  getFssaiDietaryLabel,
  validatePreparedFoodShelfLife,
} from "./fssai.ts";

describe("FSSAI Statutory Compliance Engine (packages/ui/src/fssai.ts)", () => {
  describe("validateFssaiNumber", () => {
    it("validates valid 14-digit FSSAI numbers across Central, State, and Registration types", () => {
      // Type 1: Registration (Petty Food Business) in Delhi (07)
      assert.strictEqual(validateFssaiNumber("10724001001234"), true);
      // Type 2: State License in Maharashtra (27)
      assert.strictEqual(validateFssaiNumber("22723000001234"), true);
      // Type 3: Central License with central code 00
      assert.strictEqual(validateFssaiNumber("30021000000001"), true);
    });

    it("rejects invalid lengths and invalid characters", () => {
      assert.strictEqual(validateFssaiNumber("1072400100123"), false); // 13 digits
      assert.strictEqual(validateFssaiNumber("107240010012345"), false); // 15 digits
      assert.strictEqual(validateFssaiNumber("1072400100123A"), false); // Alphabet
      assert.strictEqual(validateFssaiNumber(""), false);
      assert.strictEqual(validateFssaiNumber(null), false);
    });

    it("rejects invalid registration type prefixes (must be 1, 2, or 3)", () => {
      assert.strictEqual(validateFssaiNumber("00724001001234"), false);
      assert.strictEqual(validateFssaiNumber("40724001001234"), false);
      assert.strictEqual(validateFssaiNumber("90724001001234"), false);
    });

    it("rejects state license using central jurisdiction code '00'", () => {
      assert.strictEqual(validateFssaiNumber("20023000001234"), false);
    });

    it("rejects all-zero serial numbers", () => {
      assert.strictEqual(validateFssaiNumber("10724001000000"), false);
    });
  });

  describe("parseFssaiNumber", () => {
    it("decomposes 14-digit FSSAI into statutory parts", () => {
      const parsed = parseFssaiNumber("22723000001234");
      assert.strictEqual(parsed.isValid, true);
      assert.strictEqual(parsed.registrationType, 2);
      assert.ok(parsed.typeName?.includes("State License"));
      assert.strictEqual(parsed.stateCode, "27");
      assert.strictEqual(parsed.year, "23");
      assert.strictEqual(parsed.serialNumber, "001234");
    });
  });

  describe("calculateFssaiExpiryStatus", () => {
    const fixedToday = new Date(2026, 9, 20); // 2026-10-20

    it("marks license as VALID if expiry is more than 30 days away", () => {
      const expiry = new Date(2027, 9, 20); // 1 year away
      const result = calculateFssaiExpiryStatus(expiry, fixedToday);
      assert.strictEqual(result.status, "VALID");
      assert.strictEqual(result.isExpired, false);
      assert.strictEqual(result.isExpiringSoon, false);
      assert.strictEqual(result.canAcceptOrders, true);
      assert.ok(result.daysRemaining > 300);
    });

    it("marks license as EXPIRING_SOON if within 30 days window", () => {
      const expiry = new Date(2026, 10, 5); // ~16 days away
      const result = calculateFssaiExpiryStatus(expiry, fixedToday);
      assert.strictEqual(result.status, "EXPIRING_SOON");
      assert.strictEqual(result.isExpiringSoon, true);
      assert.strictEqual(result.isExpired, false);
      assert.strictEqual(result.canAcceptOrders, true);
      assert.strictEqual(result.daysRemaining, 16);
    });

    it("marks license as EXPIRED and BLOCKS orders if expiry date has passed", () => {
      const expiry = new Date(2026, 9, 10); // 10 days ago
      const result = calculateFssaiExpiryStatus(expiry, fixedToday);
      assert.strictEqual(result.status, "EXPIRED");
      assert.strictEqual(result.isExpired, true);
      assert.strictEqual(result.canAcceptOrders, false); // Ordering blocked!
      assert.strictEqual(result.daysRemaining, -10);
    });

    it("blocks orders if expiry date is missing", () => {
      const result = calculateFssaiExpiryStatus(null, fixedToday);
      assert.strictEqual(result.status, "MISSING");
      assert.strictEqual(result.canAcceptOrders, false);
      assert.strictEqual(result.isExpired, true);
    });
  });

  describe("getFssaiDietaryLabel (FSS Labelling & Display Regulations 2020)", () => {
    it("returns green filled circle for 100% Vegetarian food", () => {
      const veg = getFssaiDietaryLabel("VEG");
      assert.strictEqual(veg.symbolName, "GREEN_DOT");
      assert.strictEqual(veg.symbolShape, "CIRCLE_IN_SQUARE");
      assert.strictEqual(veg.primaryColor, "#008000");
      assert.strictEqual(veg.labelEnglish, "100% Vegetarian");
      assert.strictEqual(veg.isVegetarian, true);
      assert.strictEqual(veg.isNonVegetarian, false);
    });

    it("returns brown filled triangle for Non-Vegetarian food", () => {
      const nonVeg = getFssaiDietaryLabel("NON_VEG");
      assert.strictEqual(nonVeg.symbolName, "BROWN_TRIANGLE");
      assert.strictEqual(nonVeg.symbolShape, "TRIANGLE_IN_SQUARE");
      assert.strictEqual(nonVeg.labelEnglish, "Non-Vegetarian");
      assert.strictEqual(nonVeg.isVegetarian, false);
      assert.strictEqual(nonVeg.isNonVegetarian, true);
    });

    it("returns egg symbol and classification for food containing egg", () => {
      const egg = getFssaiDietaryLabel("EGG");
      assert.strictEqual(egg.symbolName, "EGG_SYMBOL");
      assert.strictEqual(egg.containsEgg, true);
      assert.strictEqual(egg.isNonVegetarian, true);
    });
  });

  describe("validatePreparedFoodShelfLife", () => {
    it("validates food is safe if within 4-hour hot holding window", () => {
      const preparedAt = new Date("2026-10-20T12:00:00Z");
      const currentTime = new Date("2026-10-20T14:30:00Z"); // 2.5 hours later
      const result = validatePreparedFoodShelfLife(preparedAt, 4, currentTime);
      assert.strictEqual(result.isSafeForConsumption, true);
      assert.strictEqual(result.isExpired, false);
      assert.strictEqual(result.minutesRemaining, 90);
    });

    it("flags food as expired if past the 4-hour hot holding window", () => {
      const preparedAt = new Date("2026-10-20T12:00:00Z");
      const currentTime = new Date("2026-10-20T16:30:00Z"); // 4.5 hours later
      const result = validatePreparedFoodShelfLife(preparedAt, 4, currentTime);
      assert.strictEqual(result.isSafeForConsumption, false);
      assert.strictEqual(result.isExpired, true);
      assert.strictEqual(result.minutesRemaining, -30);
    });
  });
});
