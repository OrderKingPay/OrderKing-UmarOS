import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { orderKingSpark } from "./order-king-spark.ts";

describe("Order King Spark - Partner AI Assistant", () => {
  test("starts without fabricated restaurant data", () => {
    assert.deepEqual(orderKingSpark.getMenuItems(), []);
    assert.deepEqual(orderKingSpark.getActiveAnomalies(), []);
  });

  test("does not claim client-only menu mutations are persisted", () => {
    assert.equal(orderKingSpark.toggleItemAvailability("item-1").success, false);
    assert.equal(orderKingSpark.updateItemPrice("item-1", 7000).success, false);
  });

  test("accepts explicitly authorized menu and anomaly snapshots", () => {
    orderKingSpark.loadAuthorizedData({
      menuItems: [{
        id: "real-1",
        name: "Verified item",
        category: "Verified category",
        pricePaise: 6500,
        isAvailable: true,
        preparationMinutes: 15,
        totalOrdersToday: 0,
      }],
      activeAnomalies: [],
    });
    assert.equal(orderKingSpark.getMenuItems()[0]?.name, "Verified item");
  });

  test("does not fabricate settlement figures", () => {
    const summary = orderKingSpark.getSettlementSummary();
    assert.equal(summary.status, "PENDING_BANK");
    assert.equal(summary.grossSalesPaise, 0);
    assert.equal(summary.netSettlementPaise, 0);
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
