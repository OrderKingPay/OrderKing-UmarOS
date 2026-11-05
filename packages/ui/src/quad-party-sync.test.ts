import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  IdempotencyGuard,
  isValidOrderTransition,
  QuadPartySyncClient,
  type QuadPartyOrderPayload,
  type QuadPartyRole,
} from "./quad-party-sync.ts";

describe("ORDERKING Quad-Party WebSocket Real-Time Synchronization Engine", () => {
  let client: QuadPartySyncClient;

  beforeEach(() => {
    client = new QuadPartySyncClient(null, 10_000);
    client.reset();
  });

  describe("1. Idempotency Guard (Ghost Driver & Duplicate Chime Prevention)", () => {
    it("generates deterministic idempotency keys", () => {
      const key1 = IdempotencyGuard.generateKey("ord_test_101", "ORDER_ACCEPTED", 1);
      const key2 = IdempotencyGuard.generateKey("ord_test_101", "ORDER_ACCEPTED", 1);
      assert.equal(key1, "qps_ord_test_101_ORDER_ACCEPTED_seq1");
      assert.equal(key1, key2);
    });

    it("registers new event and accepts first delivery", () => {
      const guard = new IdempotencyGuard(5000);
      const payload: QuadPartyOrderPayload = {
        orderId: "ord_001",
        event: "ORDER_ACCEPTED",
        status: "ACCEPTED",
        restaurantId: "rst_karimganj_01",
        timestamp: new Date().toISOString(),
        idempotencyKey: "qps_ord_001_ORDER_ACCEPTED_seq1",
        sequenceNumber: 1,
        actorRole: "partner_kds",
      };

      const accepted = guard.checkAndRegister(payload.idempotencyKey, payload);
      assert.equal(accepted, true, "First event must be accepted");
      assert.equal(guard.isProcessed(payload.idempotencyKey), true);
    });

    it("strictly rejects replayed duplicate events to prevent ghost driver assignments", () => {
      const guard = new IdempotencyGuard(5000);
      const payload: QuadPartyOrderPayload = {
        orderId: "ord_002",
        event: "RIDER_ASSIGNED",
        status: "RIDER_ASSIGNED",
        restaurantId: "rst_karimganj_01",
        riderId: "rdr_hasan_99",
        timestamp: new Date().toISOString(),
        idempotencyKey: "qps_ord_002_RIDER_ASSIGNED_seq3",
        sequenceNumber: 3,
        actorRole: "umar_os",
      };

      const firstAttempt = guard.checkAndRegister(payload.idempotencyKey, payload);
      assert.equal(firstAttempt, true, "Initial rider dispatch must succeed");

      // Duplicate delivery attempt (e.g. network retry or double click)
      const duplicateAttempt = guard.checkAndRegister(payload.idempotencyKey, payload);
      assert.equal(duplicateAttempt, false, "Duplicate rider assignment must be blocked");
      assert.equal(guard.size(), 1, "Guard must retain exactly 1 record");
    });
  });

  describe("2. Canonical State Machine Validation", () => {
    it("validates legitimate order lifecycle sequence", () => {
      assert.equal(isValidOrderTransition("CREATED", "ACCEPTED"), true);
      assert.equal(isValidOrderTransition("ACCEPTED", "PREPARING"), true);
      assert.equal(isValidOrderTransition("PREPARING", "READY"), true);
      assert.equal(isValidOrderTransition("READY", "RIDER_ASSIGNED"), true);
      assert.equal(isValidOrderTransition("RIDER_ASSIGNED", "ON_THE_WAY"), true);
      assert.equal(isValidOrderTransition("ON_THE_WAY", "DELIVERED"), true);
    });

    it("rejects illegal state jumps", () => {
      // Cannot jump from CREATED directly to DELIVERED without kitchen accept & transit
      assert.equal(isValidOrderTransition("CREATED", "DELIVERED"), false);
      // Cannot transition out of terminal state DELIVERED
      assert.equal(isValidOrderTransition("DELIVERED", "PREPARING"), false);
      assert.equal(isValidOrderTransition("CANCELLED", "READY"), false);
    });

    it("allows idempotent same-status notifications", () => {
      assert.equal(isValidOrderTransition("PREPARING", "PREPARING"), true);
      assert.equal(isValidOrderTransition("ON_THE_WAY", "ON_THE_WAY"), true);
    });
  });

  describe("3. Real-Time Quad-Party Synchronization (< 5ms local dispatch)", () => {
    it("synchronizes sub-second updates across all 4 parties when merchant clicks Accept on KDS", async () => {
      const orderId = "ord_live_8888";
      const restaurantId = "rst_diner_01";
      const customerId = "usr_cust_42";

      // Captured events for all 4 parties
      let customerReceived: QuadPartyOrderPayload | null = null;
      let partnerKdsReceived: QuadPartyOrderPayload | null = null;
      let riderFleetReceived: QuadPartyOrderPayload | null = null;
      let umarOsReceived: QuadPartyOrderPayload | null = null;

      // 1. Customer Tracking Screen subscribes to their active order
      client.subscribe(
        { role: "customer", orderId },
        (e) => {
          customerReceived = e;
        }
      );

      // 2. Partner KDS subscribes to their restaurant
      client.subscribe(
        { role: "partner_kds", restaurantId },
        (e) => {
          partnerKdsReceived = e;
        }
      );

      // 3. Rider Fleet subscribes to available unassigned dispatch pings
      client.subscribe(
        { role: "rider_fleet" },
        (e) => {
          riderFleetReceived = e;
        }
      );

      // 4. Umar OS subscribes to the entire ecosystem (God-Eye view)
      client.subscribe(
        { role: "umar_os" },
        (e) => {
          umarOsReceived = e;
        }
      );

      // MERCHANT CLICKS "ACCEPT" ON KDS
      const startTime = performance.now();
      const result = await client.broadcastTransition({
        orderId,
        event: "ORDER_ACCEPTED",
        status: "ACCEPTED",
        previousStatus: "CREATED",
        restaurantId,
        customerId,
        prepMinutes: 18,
        totalPaise: 45000, // ₹450.00
        actorRole: "partner_kds",
      });
      const dispatchLatencyMs = performance.now() - startTime;

      assert.equal(result.ok, true);
      assert.equal(result.duplicate, false);
      assert.ok(dispatchLatencyMs < 20, `Dispatch latency must be sub-second (measured: ${dispatchLatencyMs.toFixed(2)}ms)`);

      // VERIFICATION OF 4 PARTIES:
      // Party 1: Customer tracking screen immediately received update
      assert.ok(customerReceived, "Customer must receive transition");
      assert.equal((customerReceived as QuadPartyOrderPayload).status, "ACCEPTED");
      assert.equal((customerReceived as QuadPartyOrderPayload).prepMinutes, 18);

      // Party 2: Partner KDS received local confirmation
      assert.ok(partnerKdsReceived, "Partner KDS must receive event");
      assert.equal((partnerKdsReceived as QuadPartyOrderPayload).orderId, orderId);

      // Party 3: Rider Fleet terminal immediately received the dispatch radar ping
      assert.ok(riderFleetReceived, "Rider Fleet must receive dispatch ping");
      assert.equal((riderFleetReceived as QuadPartyOrderPayload).event, "ORDER_ACCEPTED");
      assert.equal((riderFleetReceived as QuadPartyOrderPayload).restaurantId, restaurantId);

      // Party 4: Umar OS God-Eye oversight immediately updated
      assert.ok(umarOsReceived, "Umar OS must receive God-Eye update");
      assert.equal((umarOsReceived as QuadPartyOrderPayload).orderId, orderId);
    });

    it("filters events by role and target boundaries", async () => {
      const eventsRole1: QuadPartyOrderPayload[] = [];
      const eventsRole2: QuadPartyOrderPayload[] = [];

      // Customer A is viewing order A
      client.subscribe(
        { role: "customer", orderId: "ord_AAA" },
        (e) => eventsRole1.push(e)
      );

      // Customer B is viewing order B
      client.subscribe(
        { role: "customer", orderId: "ord_BBB" },
        (e) => eventsRole2.push(e)
      );

      // Broadcast update for Order A only
      await client.broadcastTransition({
        orderId: "ord_AAA",
        event: "ORDER_PREPARING",
        status: "PREPARING",
        restaurantId: "rst_01",
        actorRole: "partner_kds",
      });

      assert.equal(eventsRole1.length, 1, "Customer A must receive Order A event");
      assert.equal(eventsRole2.length, 0, "Customer B must not receive Order A event");
    });

    it("discards re-broadcast duplicate with duplicate flag", async () => {
      const orderId = "ord_dup_test";
      const key = "qps_dup_key_test_123";

      const first = await client.broadcastTransition({
        orderId,
        event: "ORDER_READY",
        status: "READY",
        restaurantId: "rst_01",
        idempotencyKey: key,
        actorRole: "partner_kds",
      });
      assert.equal(first.ok, true);
      assert.equal(first.duplicate, false);

      const second = await client.broadcastTransition({
        orderId,
        event: "ORDER_READY",
        status: "READY",
        restaurantId: "rst_01",
        idempotencyKey: key,
        actorRole: "partner_kds",
      });
      assert.equal(second.ok, true);
      assert.equal(second.duplicate, true, "Second broadcast must be flagged as duplicate");
    });
  });
});
