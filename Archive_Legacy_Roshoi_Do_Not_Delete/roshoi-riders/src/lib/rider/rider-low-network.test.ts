import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  enqueueRiderOfflineAction,
  getRiderOfflineQueue,
  clearRiderOfflineQueue,
  flushRiderOfflineQueue,
  cacheRiderSet,
  cacheRiderGet,
  type RiderQueuedAction,
} from "./rider-low-network.ts";

// Polyfill localStorage in node test environment if needed
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe("Rider Low-Network & 2G Offline Cache Layer", () => {
  beforeEach(() => {
    clearRiderOfflineQueue();
    localStorage.clear();
  });

  test("caches and retrieves rider state snapshots", () => {
    const state = { riderId: "r_101", status: "ONLINE", currentDutyEarningsPaise: 45000 };
    cacheRiderSet("duty_state", state);

    const retrieved = cacheRiderGet<typeof state>("duty_state");
    assert.notEqual(retrieved, null);
    assert.equal(retrieved?.riderId, "r_101");
    assert.equal(retrieved?.status, "ONLINE");
    assert.equal(retrieved?.currentDutyEarningsPaise, 45000);
  });

  test("enqueues delivery actions when offline and preserves FIFO order", () => {
    const action1 = enqueueRiderOfflineAction({
      deliveryId: "del_1",
      action: "ARRIVE_RESTAURANT",
      idempotencyKey: "idem_1",
    });

    const action2 = enqueueRiderOfflineAction({
      deliveryId: "del_1",
      action: "PICKUP",
      idempotencyKey: "idem_2",
    });

    const queue = getRiderOfflineQueue();
    assert.equal(queue.length, 2);
    assert.equal(queue[0].action, "ARRIVE_RESTAURANT");
    assert.equal(queue[1].action, "PICKUP");
    assert.equal(queue[0].id, action1.id);
    assert.equal(queue[1].id, action2.id);
  });

  test("flushes offline queue successfully upon network recovery", async () => {
    enqueueRiderOfflineAction({
      deliveryId: "del_88",
      action: "DELIVER",
      idempotencyKey: "idem_88",
    });

    const executedActions: RiderQueuedAction[] = [];
    const result = await flushRiderOfflineQueue(async (action) => {
      executedActions.push(action);
    });

    assert.equal(result.syncedCount, 1);
    assert.equal(result.failedCount, 0);
    assert.equal(executedActions.length, 1);
    assert.equal(executedActions[0].deliveryId, "del_88");
    assert.equal(getRiderOfflineQueue().length, 0);
  });
});
