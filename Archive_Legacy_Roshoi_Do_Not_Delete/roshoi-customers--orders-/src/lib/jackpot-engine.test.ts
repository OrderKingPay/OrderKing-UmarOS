import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateScratchCard, isEligibleForScratchCard } from "./jackpot-engine.ts";

describe("King Jackpot Scratch Card & Referral Engine", () => {
  it("determines eligibility based on order value or first order", () => {
    assert.equal(isEligibleForScratchCard(15000, true), true); // First order always eligible
    assert.equal(isEligibleForScratchCard(35000, false), true); // Order >= ₹299
    assert.equal(isEligibleForScratchCard(25000, false), false); // Order < ₹299
  });

  it("generates guaranteed valuable scratch cards without empty losses", () => {
    const card = generateScratchCard("usr_123", "ORDER_ABOVE_299", 35000);
    assert.ok(card.id.startsWith("sc_"));
    assert.ok(card.title.length > 0);
    assert.ok(card.amountPaise > 0);
    assert.equal(card.isScratched, false);
    assert.ok(["CASHBACK", "DIGITAL_GOLD", "PARTNER_VOUCHER", "BUMPER_GOLD"].includes(card.type));
  });

  it("generates scratch cards for referral milestones", () => {
    const card = generateScratchCard("usr_456", "REFERRAL_MILESTONE");
    assert.ok(card.amountPaise >= 2000); // At least ₹20
    assert.ok(card.description.length > 0);
  });
});
