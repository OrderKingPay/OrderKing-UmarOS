import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  platformConfig,
  DELIVERY_COMMISSION_TIERS,
  DEFAULT_DELIVERY_COMMISSION_BPS,
  COMMISSION_OPTIONS_BPS,
  DELIVERY_COMMISSION_TIER_LIST,
} from "./platform-config.ts";

describe("platform configuration & brand standards", () => {
  it("enforces brand name is 'Order King' (two words) in all user-facing properties", () => {
    assert.equal(platformConfig.brand.name, "Order King");
    assert.equal(platformConfig.brand.appName, "Order King Partner");
    assert.equal(platformConfig.brand.shortAppName, "Order King");
    assert.equal(platformConfig.brand.restaurantFacingBrandName, "Order King Partner");
    assert.equal(platformConfig.brand.customerFacingBrand, "Order King");
    assert.equal(platformConfig.brand.adminFacingBrand, "Order King Command");
    assert.equal(platformConfig.brand.legalCompanyName, "Order King Foods Private Limited");
    assert.equal(platformConfig.brand.notificationSenderName, "Order King");
    assert.ok(platformConfig.brand.invoiceFooter.includes("Order King"));
  });

  it("enforces AI branding is 'King AI' with zero Umar in user-facing context", () => {
    assert.equal(platformConfig.brand.aiBrandName, "King AI");
    assert.equal(platformConfig.brand.aiAssistantName, "King AI");
    assert.equal(platformConfig.ai.brandName, "King AI");
    assert.equal(platformConfig.ai.assistantName, "King AI");

    const brandValues = Object.values(platformConfig.brand);
    for (const val of brandValues) {
      if (typeof val === "string") {
        assert.ok(!val.toLowerCase().includes("umar"), `Brand property contains forbidden term 'umar': ${val}`);
      }
    }
  });

  it("verifies default delivery commission is 28% (2800 bps)", () => {
    assert.equal(DEFAULT_DELIVERY_COMMISSION_BPS, 2800);
    assert.equal(platformConfig.restaurantSettings.defaultCommissionBps, 2800);
    assert.equal(platformConfig.commission.targetBps, 2800);
    assert.equal(platformConfig.commission.defaultBps, 2800);
    assert.equal(platformConfig.commission.defaultDeliveryCommissionBps, 2800);
    assert.equal(platformConfig.commission.defaultDineInCommissionBps, 0);
  });

  it("verifies DELIVERY_COMMISSION_TIERS exact values", () => {
    assert.equal(DELIVERY_COMMISSION_TIERS.DINE_IN, 0);
    assert.equal(DELIVERY_COMMISSION_TIERS.ENTERPRISE, 1800);
    assert.equal(DELIVERY_COMMISSION_TIERS.GROWTH, 2200);
    assert.equal(DELIVERY_COMMISSION_TIERS.STANDARD, 2500);
    assert.equal(DELIVERY_COMMISSION_TIERS.FULL_SERVICE, 2800);
  });

  it("verifies commission tier metadata list alignment", () => {
    assert.equal(DELIVERY_COMMISSION_TIER_LIST.length, 5);
    const dineIn = DELIVERY_COMMISSION_TIER_LIST.find((t) => t.key === "DINE_IN");
    const enterprise = DELIVERY_COMMISSION_TIER_LIST.find((t) => t.key === "ENTERPRISE");
    const growth = DELIVERY_COMMISSION_TIER_LIST.find((t) => t.key === "GROWTH");
    const standard = DELIVERY_COMMISSION_TIER_LIST.find((t) => t.key === "STANDARD");
    const fullService = DELIVERY_COMMISSION_TIER_LIST.find((t) => t.key === "FULL_SERVICE");

    assert.ok(dineIn && dineIn.bps === 0 && dineIn.percentage === 0);
    assert.ok(enterprise && enterprise.bps === 1800 && enterprise.percentage === 18);
    assert.ok(growth && growth.bps === 2200 && growth.percentage === 22);
    assert.ok(standard && standard.bps === 2500 && standard.percentage === 25);
    assert.ok(fullService && fullService.bps === 2800 && fullService.percentage === 28);
  });

  it("verifies COMMISSION_OPTIONS_BPS matches tier values", () => {
    assert.deepEqual([...COMMISSION_OPTIONS_BPS], [0, 1800, 2200, 2500, 2800]);
  });
});
