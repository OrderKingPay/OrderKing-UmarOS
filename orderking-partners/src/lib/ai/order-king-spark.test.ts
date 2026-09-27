import assert from "node:assert/strict";
import { test } from "node:test";
import { orderKingSpark } from "./order-king-spark.ts";

test("legacy Spark facade has no seeded production data", () => {
  assert.deepEqual(orderKingSpark.getMenuItems(), []);
  assert.deepEqual(orderKingSpark.getActiveAnomalies(), []);
});

test("legacy Spark refuses synthetic settlement data", () => {
  assert.throws(
    () => orderKingSpark.getSettlementSummary(),
    /LIVE_RESTAURANT_DATA_REQUIRED/,
  );
});

test("legacy Spark compatibility response is explicitly live-data-only", () => {
  const message = orderKingSpark.handleRestaurantQuery("show me today's sales");
  assert.match(message.text, /live Restaurant AI assistant/i);
});
