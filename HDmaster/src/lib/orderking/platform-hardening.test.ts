import { describe, it } from "node:test";
import assert from "node:assert";
import {
  checkRateLimit,
  getRateLimitHeaders,
  resetStore,
  type RateLimitResult,
} from "./server/rate-limiter.ts";
import {
  calculateSurge,
  surgeForZone,
  surgeForAllZones,
  type SurgeFactors,
} from "./finance/surge-pricing.ts";
import {
  calculateEarn,
  calculateBurn,
  determineTier,
  getTierConfig,
  getTierProgress,
  qualifiesForFreeDelivery,
} from "./finance/loyalty-engine.ts";
import {
  renderTemplate,
  buildNotification,
  resolveChannels,
  NOTIFICATION_TEMPLATES,
} from "./server/push-notifications.ts";

// ---------------------------------------------------------------------------
// Rate Limiter Tests
// ---------------------------------------------------------------------------
describe("rate-limiter", () => {
  it("allows requests within limit", () => {
    resetStore();
    const result = checkRateLimit("user1", "GET /test", { maxRequests: 5, windowMs: 60_000 });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, 4);
  });

  it("blocks after limit exceeded", () => {
    resetStore();
    for (let i = 0; i < 5; i++) {
      checkRateLimit("user2", "GET /test2", { maxRequests: 5, windowMs: 60_000 });
    }
    const result = checkRateLimit("user2", "GET /test2", { maxRequests: 5, windowMs: 60_000 });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.remaining, 0);
  });

  it("auto-bans on abuse threshold", () => {
    resetStore();
    for (let i = 0; i < 15; i++) {
      checkRateLimit("abuser", "GET /abuse", { maxRequests: 5, windowMs: 60_000, banThresholdMultiplier: 3 });
    }
    const result = checkRateLimit("abuser", "GET /abuse", { maxRequests: 5, windowMs: 60_000, banThresholdMultiplier: 3 });
    assert.strictEqual(result.banned, true);
    assert.strictEqual(result.allowed, false);
  });

  it("generates correct rate limit headers", () => {
    const result: RateLimitResult = { allowed: false, remaining: 0, resetMs: 30_000, banned: false, retryAfterMs: 30_000 };
    const headers = getRateLimitHeaders(result);
    assert.strictEqual(headers["Retry-After"], "30");
    assert.strictEqual(headers["X-RateLimit-Remaining"], "0");
  });

  it("isolates different clients", () => {
    resetStore();
    for (let i = 0; i < 5; i++) {
      checkRateLimit("clientA", "GET /iso", { maxRequests: 5, windowMs: 60_000 });
    }
    const resultA = checkRateLimit("clientA", "GET /iso", { maxRequests: 5, windowMs: 60_000 });
    const resultB = checkRateLimit("clientB", "GET /iso", { maxRequests: 5, windowMs: 60_000 });
    assert.strictEqual(resultA.allowed, false);
    assert.strictEqual(resultB.allowed, true);
  });
});

// ---------------------------------------------------------------------------
// Surge Pricing Tests
// ---------------------------------------------------------------------------
describe("surge-pricing", () => {
  it("returns no surge when supply exceeds demand", () => {
    const result = calculateSurge({
      activeOrders: 5,
      availableRiders: 15,
      totalRiders: 20,
      hour: 10,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
    });
    assert.strictEqual(result.active, false);
    assert.strictEqual(result.surgeBps, 10000);
    assert.strictEqual(result.adjustedDeliveryFeePaise, 3000);
  });

  it("applies surge when riders are scarce", () => {
    const result = calculateSurge({
      activeOrders: 20,
      availableRiders: 5,
      totalRiders: 30,
      hour: 20,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
      badWeather: true,
    });
    assert.strictEqual(result.active, true);
    assert.ok(result.surgeBps > 10000, "Surge should be above 1.0x");
    assert.ok(result.adjustedDeliveryFeePaise > 3000, "Delivery fee should increase");
    assert.ok(result.factors.length > 0, "Should have surge factors");
  });

  it("caps surge at maximum 2.5x", () => {
    const result = calculateSurge({
      activeOrders: 100,
      availableRiders: 1,
      totalRiders: 50,
      hour: 21,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
      badWeather: true,
      avgPrepMinutes: 40,
    });
    assert.ok(result.surgeBps <= 25000, "Must not exceed 2.5x");
  });

  it("surgeForZone uses current hour", () => {
    const result = surgeForZone({
      activeOrders: 5,
      availableRiders: 10,
      totalRiders: 20,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
    });
    assert.ok(typeof result.surgeBps === "number");
    assert.ok(typeof result.surgeLabel === "string");
  });

  it("surgeForAllZones returns per-zone results", () => {
    const results = surgeForAllZones([
      { zoneId: "z1", activeOrders: 2, availableRiders: 8, totalRiders: 10, baseDeliveryFeePaise: 2500, baseMinOrderPaise: 9900 },
      { zoneId: "z2", activeOrders: 15, availableRiders: 3, totalRiders: 10, baseDeliveryFeePaise: 3000, baseMinOrderPaise: 9900 },
    ]);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].zoneId, "z1");
    assert.strictEqual(results[1].zoneId, "z2");
    assert.ok(results[1].surgeBps >= results[0].surgeBps, "Higher demand zone should have equal or higher surge");
  });
});

// ---------------------------------------------------------------------------
// Loyalty Engine Tests
// ---------------------------------------------------------------------------
describe("loyalty-engine", () => {
  it("determines correct tier from lifetime points", () => {
    assert.strictEqual(determineTier(0), "BRONZE");
    assert.strictEqual(determineTier(499), "BRONZE");
    assert.strictEqual(determineTier(500), "SILVER");
    assert.strictEqual(determineTier(2000), "GOLD");
    assert.strictEqual(determineTier(5000), "PLATINUM");
    assert.strictEqual(determineTier(15000), "DIAMOND");
    assert.strictEqual(determineTier(100000), "DIAMOND");
  });

  it("calculates earn correctly for Bronze tier", () => {
    const result = calculateEarn(50000, "BRONZE"); // ₹500 order
    assert.ok(result.pointsEarned > 0, "Should earn points");
    assert.strictEqual(result.tier, "BRONZE");
    assert.strictEqual(result.bonusApplied, null);
  });

  it("applies first order bonus (3x)", () => {
    const normal = calculateEarn(50000, "GOLD");
    const bonus = calculateEarn(50000, "GOLD", { firstOrderBonus: true });
    assert.ok(bonus.pointsEarned > normal.pointsEarned, "Bonus should give more points");
    assert.strictEqual(bonus.bonusApplied, "FIRST_ORDER_3X");
  });

  it("burns points with correct paise conversion", () => {
    const result = calculateBurn(100, 500, 50000, "GOLD", 0, 10);
    assert.ok(result.pointsBurned <= 100, "Should not burn more than requested");
    assert.ok(result.discountPaise > 0, "Should produce discount");
    assert.strictEqual(result.remainingPoints, 500 - result.pointsBurned);
  });

  it("enforces daily burn cap", () => {
    const result = calculateBurn(100, 500, 50000, "GOLD", 10, 10);
    assert.strictEqual(result.pointsBurned, 0, "Should block burn when daily cap reached");
    assert.strictEqual(result.discountPaise, 0);
  });

  it("caps discount at 50% of order", () => {
    const result = calculateBurn(99999, 99999, 10000, "DIAMOND", 0, 10);
    assert.ok(result.discountPaise <= 5000, "Discount should not exceed 50% of order");
  });

  it("qualifiesForFreeDelivery works correctly", () => {
    assert.strictEqual(qualifiesForFreeDelivery(100000, "BRONZE"), true); // ₹1000 > ₹999
    assert.strictEqual(qualifiesForFreeDelivery(5000, "BRONZE"), false); // ₹50 < ₹999
    assert.strictEqual(qualifiesForFreeDelivery(1, "DIAMOND"), true); // Diamond = ₹0 threshold
  });

  it("getTierProgress returns correct progress", () => {
    const progress = getTierProgress("SILVER", 1200);
    assert.strictEqual(progress.currentTier, "SILVER");
    assert.strictEqual(progress.nextTier, "GOLD");
    assert.ok(progress.pointsToNextTier > 0);
    assert.ok(progress.progressPercent >= 0 && progress.progressPercent <= 100);
  });

  it("Diamond tier has no next tier", () => {
    const progress = getTierProgress("DIAMOND", 50000);
    assert.strictEqual(progress.nextTier, null);
    assert.strictEqual(progress.progressPercent, 100);
  });

  it("getTierConfig returns valid config", () => {
    const config = getTierConfig("PLATINUM");
    assert.strictEqual(config.tier, "PLATINUM");
    assert.ok(config.earnRateBps > 0);
    assert.ok(config.burnRateBps > 0);
  });
});

// ---------------------------------------------------------------------------
// Push Notifications Tests
// ---------------------------------------------------------------------------
describe("push-notifications", () => {
  it("renders templates with variables", () => {
    const rendered = renderTemplate("order_placed", { orderId: "ORD123" });
    assert.ok(rendered !== null);
    assert.ok(rendered.body.includes("ORD123"), "Should interpolate orderId");
    assert.ok(!rendered.body.includes("{orderId}"), "Should not have raw placeholder");
  });

  it("handles #{var} hash-placeholder pattern", () => {
    const rendered = renderTemplate("order_placed", { orderId: "ORD456" });
    assert.ok(rendered !== null);
    assert.ok(rendered.body.includes("ORD456"));
  });

  it("returns null for unknown template", () => {
    const rendered = renderTemplate("nonexistent_template", {});
    assert.strictEqual(rendered, null);
  });

  it("builds complete notification payload", () => {
    const notif = buildNotification(
      "rider_assigned",
      { userId: "u1", deviceToken: "fcm_token" },
      { riderName: "Rahul", restaurantName: "Biryani House" },
      "org_1",
      { orderId: "ORD789", deepLink: "/orders/ORD789" }
    );
    assert.ok(notif !== null);
    assert.ok(notif.id.startsWith("notif_"));
    assert.strictEqual(notif.priority, "HIGH");
    assert.ok(notif.content.body.includes("Rahul"));
    assert.ok(notif.content.body.includes("Biryani House"));
    assert.strictEqual(notif.tracking.orderId, "ORD789");
  });

  it("resolves channels based on capabilities", () => {
    const channels = resolveChannels("order_cancelled", true, true, false);
    assert.ok(channels.includes("FCM"), "Should include FCM when device token exists");
    assert.ok(channels.includes("SMS"), "Should include SMS when phone exists");
    assert.ok(!channels.includes("EMAIL"), "Should not include EMAIL when no email");
    assert.ok(channels.includes("IN_APP"), "Should always include IN_APP");
  });

  it("resolves only IN_APP when no capabilities", () => {
    const channels = resolveChannels("order_placed", false, false, false);
    assert.deepStrictEqual(channels, ["IN_APP"]);
  });

  it("has all required system templates", () => {
    const required = ["order_placed", "order_delivered", "new_order", "delivery_offer", "payment_failed"];
    for (const key of required) {
      assert.ok(NOTIFICATION_TEMPLATES[key], `Missing template: ${key}`);
    }
  });
});
