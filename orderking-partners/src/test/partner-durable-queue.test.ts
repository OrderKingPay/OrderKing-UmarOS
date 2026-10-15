import { describe, it, beforeEach } from "vitest";
import assert from "node:assert/strict";
import {
  initQueueDB,
  enqueueMutation,
  flushQueue,
  getQueueStats,
  type QueueItem,
} from "@/lib/offline/durable-queue";

describe("OrderKing Partner Kitchen Durable Queue & Offline KOT Storage", () => {
  beforeEach(async () => {
    try {
      const db = await initQueueDB();
      const tx = db.transaction(["mutations", "dead_letters"], "readwrite");
      await tx.objectStore("mutations").clear();
      await tx.objectStore("dead_letters").clear();
    } catch {}
  });

  it("enqueues kitchen KOT mutations durably with idempotency keys", async () => {
    await enqueueMutation({
      orderId: "ord_kot_101",
      restaurantId: "rest_biryani_01",
      action: "accept",
      idempotencyKey: "idem_accept_101",
    });

    await enqueueMutation({
      orderId: "ord_kot_101",
      restaurantId: "rest_biryani_01",
      action: "preparing",
      idempotencyKey: "idem_prep_101",
    });

    const stats = await getQueueStats();
    assert.equal(stats.pendingCount, 2);
    assert.equal(stats.dlqCount, 0);
  });

  it("flushes queued KOT transitions in strict FIFO order upon reconnection", async () => {
    await enqueueMutation({
      orderId: "ord_kot_1",
      restaurantId: "rest_01",
      action: "accept",
      idempotencyKey: "idem_1",
    });

    await enqueueMutation({
      orderId: "ord_kot_2",
      restaurantId: "rest_01",
      action: "ready",
      idempotencyKey: "idem_2",
    });

    const executed: any[] = [];
    await flushQueue(async (payload) => {
      executed.push(payload.data);
      return { ok: true };
    });

    assert.equal(executed.length, 2);
    assert.equal(executed[0].orderId, "ord_kot_1");
    assert.equal(executed[0].action, "accept");
    assert.equal(executed[1].orderId, "ord_kot_2");
    assert.equal(executed[1].action, "ready");

    const stats = await getQueueStats();
    assert.equal(stats.pendingCount, 0);
  });

  it("moves unretryable client-rejected mutations to Dead Letter Queue (DLQ)", async () => {
    await enqueueMutation({
      orderId: "ord_bad_order",
      restaurantId: "rest_01",
      action: "reject",
      reason: "out_of_stock",
      idempotencyKey: "idem_bad_1",
    });

    // Simulate 400 Bad Request error from server
    await flushQueue(async () => {
      const error: any = new Error("Invalid transition: already rejected");
      error.status = 400;
      throw error;
    });

    const stats = await getQueueStats();
    assert.equal(stats.pendingCount, 0);
    assert.equal(stats.dlqCount, 1);
  });
});
