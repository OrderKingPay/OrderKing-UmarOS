import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { orderKingSpark, getNextDay06AM } from "./order-king-spark.ts";

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

  test("toggles 86 stock with automated 06:00 AM next-day reset timestamp", () => {
    const res = orderKingSpark.toggleItemAvailability("item-biryani-01", { autoReset6AM: true });
    assert.equal(res.success, true);
    assert.equal(res.item?.isAvailable, false);
    assert.ok(res.item?.nextAvailableAt);

    const resetDate = new Date(res.item.nextAvailableAt);
    assert.equal(resetDate.getHours(), 6);
    assert.equal(resetDate.getMinutes(), 0);

    // Toggle back
    orderKingSpark.toggleItemAvailability("item-biryani-01");
  });

  test("getNextDay06AM correctly rolls over after 06:00 AM", () => {
    // 2:00 PM (14:00) on 2026-10-14 -> resets next day 2026-10-15 06:00 AM
    const afternoon = new Date("2026-10-14T14:00:00Z");
    afternoon.setHours(14, 0, 0, 0);
    const nextAfternoon = getNextDay06AM(afternoon);
    assert.equal(nextAfternoon.getHours(), 6);
    assert.equal(nextAfternoon.getDate(), afternoon.getDate() + 1);

    // 2:00 AM (02:00) on 2026-10-14 -> resets today 2026-10-14 06:00 AM
    const earlyMorning = new Date(afternoon);
    earlyMorning.setHours(2, 0, 0, 0);
    const nextEarly = getNextDay06AM(earlyMorning);
    assert.equal(nextEarly.getHours(), 6);
    assert.equal(nextEarly.getDate(), earlyMorning.getDate());
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

  test("arbitrates food spill disputes to LOGISTICS liability protecting merchant payout", () => {
    const spillCase = {
      disputeId: "dsp-test-spill",
      orderId: "ord-9901",
      customerName: "Siddharth Sen",
      complaintType: "FOOD_SPILL" as const,
      complaintText: "Curry gravies leaked inside carry bag during bike transit.",
      claimAmountPaise: 29000,
      prepTimeMinutes: 14,
      transitTimeMinutes: 48,
      spillPhotoSubmitted: true,
      sealIntactReported: true,
    };

    const decision = orderKingSpark.arbitrateDispute(spillCase);
    assert.equal(decision.liability, "LOGISTICS");
    assert.equal(decision.merchantLiabilityPaise, 0); // Merchant protected
    assert.equal(decision.logisticsLiabilityPaise, 29000);
    assert.ok(decision.legalSenseRationale.includes("rider bike transit"));
  });

  test("arbitrates missing item disputes to MERCHANT liability with 5% GST adjustment", () => {
    const missingCase = {
      disputeId: "dsp-test-missing",
      orderId: "ord-9902",
      customerName: "Pooja V",
      complaintType: "MISSING_ITEM" as const,
      complaintText: "Ordered 2 Garlic Naans, but only 1 was packed.",
      claimAmountPaise: 6000,
      prepTimeMinutes: 12,
      transitTimeMinutes: 18,
      spillPhotoSubmitted: false,
      sealIntactReported: true,
      itemValuePaise: 6000,
    };

    const decision = orderKingSpark.arbitrateDispute(missingCase);
    assert.equal(decision.liability, "MERCHANT");
    assert.equal(decision.merchantLiabilityPaise, 6000);
    assert.equal(decision.logisticsLiabilityPaise, 0);
    assert.equal(decision.gstReversalPaise, 300); // 5% of 6000 paise
  });

  test("arbitrates subjective taste disputes to PLATFORM_REJECTED protecting merchant payout", () => {
    const tasteCase = {
      disputeId: "dsp-test-taste",
      orderId: "ord-9903",
      customerName: "Amit Roy",
      complaintType: "SUBJECTIVE_TASTE" as const,
      complaintText: "Biryani was not as spicy as I expected.",
      claimAmountPaise: 38000,
      prepTimeMinutes: 15,
      transitTimeMinutes: 20,
      spillPhotoSubmitted: false,
      sealIntactReported: true,
    };

    const decision = orderKingSpark.arbitrateDispute(tasteCase);
    assert.equal(decision.liability, "PLATFORM_REJECTED");
    assert.equal(decision.merchantLiabilityPaise, 0); // 0 deduction
    assert.equal(decision.refundApprovedPaise, 0);
  });

  test("generates menu description and pricing intelligence with high-margin portions", () => {
    const intelligence = orderKingSpark.suggestMenuIntelligence(
      "Special Mutton Dum Biryani",
      "Biryani & Rice",
      38000
    );

    assert.ok(intelligence.highConvertingDescription.length > 50);
    assert.ok(intelligence.highConvertingDescription.includes("slow-simmered") || intelligence.highConvertingDescription.includes("Slow-simmered"));
    assert.ok(intelligence.allergens.length > 0);
    assert.ok(intelligence.projectedMarginPercent >= 65);
    assert.ok(intelligence.portionStrategy.portionName.includes("Solo"));
  });

  test("generates conversational daily shift and financial recon report with 9(5) GST", () => {
    const recon = orderKingSpark.generateDailyShiftRecon("Today");

    assert.ok(recon.totalDeliveredOrders > 0);
    assert.equal(recon.orderKingPlatformCommissionPaise, 0); // 0% commission
    assert.ok(recon.aggregatorCommissionAvoidedPaise > 0);
    assert.ok(recon.gst95RemittedByPlatformPaise > 0); // 5% CGST Sec 9(5)
    assert.ok(recon.tcsSection52Paise > 0); // 0.5% TCS
    assert.ok(recon.tdsSection194OPaise > 0); // 0.1% TDS
    assert.ok(recon.netPayoutAccruedPaise > 0);
    assert.ok(recon.conversationalSummary.includes("GST Sec 9(5)"));
    assert.ok(recon.conversationalSummary.includes("0% Commission"));
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

    // 4. Dispute Arbitrator query
    const disputeReply = orderKingSpark.handleRestaurantQuery("How do you arbitrate missing items and customer food spill disputes?");
    assert.equal(disputeReply.sender, "spark");
    assert.ok(disputeReply.text.includes("Customer Dispute & Refund Arbitrator"));
    assert.equal(disputeReply.actionCard?.type, "dispute_arbitration");

    // 5. Menu Intelligence query
    const descReply = orderKingSpark.handleRestaurantQuery("Suggest high-margin dish descriptions and pricing intelligence");
    assert.equal(descReply.sender, "spark");
    assert.ok(descReply.text.includes("Menu Description & Pricing Intelligence"));
    assert.equal(descReply.actionCard?.type, "menu_intelligence");

    // 6. Daily Shift Recon query
    const reconReply = orderKingSpark.handleRestaurantQuery("Give me today's shift report and 9(5) GST financial recon");
    assert.equal(reconReply.sender, "spark");
    assert.ok(reconReply.text.includes("Daily Shift & Statutory Tax Recon Report"));
    assert.equal(reconReply.actionCard?.type, "shift_recon");

    // 7. Growth & general query
    const growthReply = orderKingSpark.handleRestaurantQuery("How can I get more orders?");
    assert.equal(growthReply.sender, "spark");
    assert.ok(growthReply.text.includes("Order King Spark Active"));
    assert.equal(growthReply.actionCard?.type, "growth_plan");
  });
});
