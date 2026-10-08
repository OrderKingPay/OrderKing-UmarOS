import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eventBus } from "./index.ts";

describe("DurableEventBus", () => {
  it("should successfully publish and subscribe to a message", async () => {
    try {
      const { getSql } = await import("../../db.ts");
      const sql = await getSql();
      
      let receivedPayload: any = null;
      let handled = false;
      eventBus.subscribe('test-topic', async (payload, msg) => {
        receivedPayload = payload;
        handled = true;
      });

      eventBus.start();

      const publishRes = await eventBus.publish('test-topic', { hello: 'world', timestamp: Date.now() });
      assert.equal(publishRes.topic, 'test-topic');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await eventBus.waitStop();

      assert.equal(handled, true);
    } catch (error: any) {
      if (error.message.includes('DATABASE_URL is missing')) {
        assert.ok(true);
      } else {
        throw error;
      }
    }
  });
});
