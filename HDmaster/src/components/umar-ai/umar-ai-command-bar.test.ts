import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseNaturalLanguageConfigCommand } from "./umar-ai-command-parser.ts";

describe("UmarOS Natural Language Command Bar Parser", () => {
  it("parses food platform fee command accurately into umar_os_config patch", () => {
    const res = parseNaturalLanguageConfigCommand("set food platform fee to 12");
    assert.ok(res !== null);
    assert.equal(res.category, "FEE_UPDATE");
    assert.equal(res.targetKey, "founder_fees");
    assert.equal(res.patch.food_platform_fee, 12);
    assert.equal(res.patch.platform_fee_paise, 1200);
    assert.ok(res.summary.includes("₹12"));
  });

  it("parses alternate food platform fee phrasing with rupee symbol", () => {
    const res = parseNaturalLanguageConfigCommand("set platform fee to ₹15");
    assert.ok(res !== null);
    assert.equal(res.patch.food_platform_fee, 15);
    assert.equal(res.patch.platform_fee_paise, 1500);
  });

  it("parses KingPay remittance fee command accurately", () => {
    const res = parseNaturalLanguageConfigCommand("set remit fee to 1.5");
    assert.ok(res !== null);
    assert.equal(res.category, "FEE_UPDATE");
    assert.equal(res.targetKey, "founder_fees");
    assert.equal(res.patch.remit_fee, 1.5);
    assert.ok(res.summary.includes("1.5%"));
  });

  it("parses remittance fee with percentage sign", () => {
    const res = parseNaturalLanguageConfigCommand("set remittance fee to 2.25%");
    assert.ok(res !== null);
    assert.equal(res.patch.remit_fee, 2.25);
  });

  it("parses Travel PNR convenience fee directive", () => {
    const res = parseNaturalLanguageConfigCommand("set travel pnr fee to 35");
    assert.ok(res !== null);
    assert.equal(res.targetKey, "founder_fees");
    assert.equal(res.patch.travel_pnr_convenience_fee_inr, 35);
  });

  it("parses wallet cashback reward directive", () => {
    const res = parseNaturalLanguageConfigCommand("set wallet cashback to 10");
    assert.ok(res !== null);
    assert.equal(res.targetKey, "founder_fees");
    assert.equal(res.patch.wallet_cashback_reward_inr, 10);
  });

  it("parses restaurant commission rate directive", () => {
    const res = parseNaturalLanguageConfigCommand("set restaurant commission to 18%");
    assert.ok(res !== null);
    assert.equal(res.category, "COMMISSION_UPDATE");
    assert.equal(res.targetKey, "economics");
    assert.equal(res.patch.default_commission_percent, 18);
  });

  it("parses dynamic surge multiplier directive", () => {
    const res = parseNaturalLanguageConfigCommand("set surge multiplier to 1.4");
    assert.ok(res !== null);
    assert.equal(res.category, "SURGE_UPDATE");
    assert.equal(res.targetKey, "economics");
    assert.equal(res.patch.surge_multiplier, 1.4);
  });

  it("parses base delivery fee directive", () => {
    const res = parseNaturalLanguageConfigCommand("set delivery fee to 35");
    assert.ok(res !== null);
    assert.equal(res.targetKey, "economics");
    assert.equal(res.patch.base_delivery_fee_inr, 35);
  });

  it("returns null on unrecognizable inputs", () => {
    const res = parseNaturalLanguageConfigCommand("hello how is the weather today");
    assert.equal(res, null);
  });
});
