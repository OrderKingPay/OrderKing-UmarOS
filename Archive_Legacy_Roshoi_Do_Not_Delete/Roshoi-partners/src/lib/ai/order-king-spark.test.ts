import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { orderKingSpark } from "./order-king-spark.ts";

describe("Order King Spark - Partner AI Assistant", () => {
  test("initializes default live menu items and categories", () => {
    const items = orderKingSpark.getMenuItems();
    assert.ok(items.length >= 4);

    const categories = items.map((i) => i.category);
    assert.ok(categories.includes("Biryani & Rice"));
    assert.ok(categories.includes("Curries"));
    assert.ok(categories.includes("Breads"));
    assert.ok(categories.includes("Desserts"));
  });

  test("toggles item availability instantly for stockout management", () => {
    // dessert starts as unavailable (false)
    const initial = orderKingSpark.getMenuItems().find((i) => i.id === "item-dessert-04");
    assert.equal(initial?.isAvailable, false);

    // Toggle to available
    const res1 = orderKingSpark.toggleItemAvailability("item-dessert-04");
    assert.equal(res1.success, true);
    assert.equal(res1.item?.isAvailable, true);

    // Toggle back to unavailable
    const res2 = orderKingSpark.toggleItemAvailability("item-dessert-04");
    assert.equal(res2.success, true);
    assert.equal(res2.item?.isAvailable, false);
  });

  test("updates menu item pricing with positive amounts", () => {
    const res = orderKingSpark.updateItemPrice("item-roti-03", 6500); // ₹65
    assert.equal(res.success, true);
    assert.equal(res.item?.pricePaise, 6500);

    // Invalid negative price rejected
    const invalid = orderKingSpark.updateItemPrice("item-roti-03", -100);
    assert.equal(invalid.success, false);
  });

  test("retrieves proactive kitchen anomaly signals", () => {
    const anomalies = orderKingSpark.getActiveAnomalies();
    assert.ok(anomalies.length >= 2);

    const types = anomalies.map((a) => a.type);
    assert.ok(types.includes("PREP_DELAY"));
    assert.ok(types.includes("SALES_DECLINE"));
  });

  test("calculates 0% platform commission settlement with Swiggy/Zomato avoided loss", () => {
    const summary = orderKingSpark.getSettlementSummary();

    assert.equal(summary.commissionPaidPaise, 0); // 0% commission!
    assert.ok(summary.grossSalesPaise > 0);
    assert.equal(summary.netSettlementPaise, summary.grossSalesPaise);
    assert.equal(summary.swiggyZomatoLossAvoidedPaise, Math.round(summary.grossSalesPaise * 0.24));
    assert.equal(summary.status, "SETTLED");
  });

  test("handles natural language queries with context-aware action cards", () => {
    // 1. Settlement query
    const settlementReply = orderKingSpark.handleRestaurantQuery("How much money did I save on commission?");
    assert.equal(settlementReply.sender, "spark");
    assert.ok(settlementReply.text.includes("0% Commission"));
    assert.equal(settlementReply.actionCard?.type, "settlement_breakdown");

    // 2. Menu query
    const menuReply = orderKingSpark.handleRestaurantQuery("Check my live menu items");
    assert.equal(menuReply.sender, "spark");
    assert.ok(menuReply.text.includes("Menu & Item Availability"));
    assert.equal(menuReply.actionCard?.type, "menu_toggle");

    // 3. Kitchen SLA query
    const kitchenReply = orderKingSpark.handleRestaurantQuery("Are there any delays in the kitchen?");
    assert.equal(kitchenReply.sender, "spark");
    assert.ok(kitchenReply.text.includes("Kitchen Operations & SLA Monitor"));
    assert.equal(kitchenReply.actionCard?.type, "anomaly_alert");

    // 4. Growth & general query
    const growthReply = orderKingSpark.handleRestaurantQuery("How can I get more orders?");
    assert.equal(growthReply.sender, "spark");
    assert.ok(growthReply.text.includes("Order King Spark Active"));
    assert.equal(growthReply.actionCard?.type, "growth_plan");
  });
});
