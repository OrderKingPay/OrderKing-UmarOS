import { describe, it, expect } from "vitest";
import {
  AutonomousDispatchEngine,
  haversineDistanceMeters,
  calculateBearingDegrees,
  type Rider,
  type OrderItem,
} from "./autonomous-dispatch-engine";

describe("Supreme Autonomous Dispatch Engine", () => {
  const engine = new AutonomousDispatchEngine();

  // Test Locations in Guwahati/Delhi
  const RESTAURANT_A = { latitude: 26.1445, longitude: 91.7362 }; // GS Road Central
  const RESTAURANT_ADJACENT = { latitude: 26.1455, longitude: 91.7372 }; // ~150m away (<300m)
  const RESTAURANT_FAR = { latitude: 26.1555, longitude: 91.7482 }; // ~1.8km away (>300m)

  const DROPOFF_A = { latitude: 26.152, longitude: 91.742 }; // ~1.0km from pickup
  const DROPOFF_CORRIDOR_NEAR = { latitude: 26.157, longitude: 91.746 }; // ~700m from Dropoff A (<1.5km corridor)
  const DROPOFF_FAR_AWAY = { latitude: 26.185, longitude: 91.785 }; // ~5.5km away (>1.5km)

  describe("Geospatial & Haversine Distance Calculations", () => {
    it("computes accurate distance in meters between coordinates", () => {
      const dist = haversineDistanceMeters(RESTAURANT_A, RESTAURANT_ADJACENT);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(250); // Approximately 150m
    });

    it("calculates bearing degrees between two points", () => {
      const bearing = calculateBearingDegrees(RESTAURANT_A, DROPOFF_A);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThanOrEqual(360);
    });
  });

  describe("Predictive Kitchen Prep Time (8–15 mins) & POS Auto-Accept", () => {
    it("predicts 8 minutes for low volume order in normal mode", () => {
      const items: OrderItem[] = [
        { id: "1", name: "Butter Naan", quantity: 2, unitPricePaise: 8000 },
      ];
      const result = engine.predictKitchenPrepTime({ items, rushMode: "NORMAL" });
      expect(result.prepMinutes).toBe(8);
      expect(result.rushAdditionMinutes).toBe(0);
    });

    it("scales prep time with item volume up to canonical range", () => {
      const items: OrderItem[] = [
        { id: "1", name: "Paneer Tikka", quantity: 2, unitPricePaise: 24000 },
        { id: "2", name: "Dal Makhani", quantity: 2, unitPricePaise: 22000 },
        { id: "3", name: "Butter Naan", quantity: 4, unitPricePaise: 16000 },
      ];
      const result = engine.predictKitchenPrepTime({ items, rushMode: "NORMAL" });
      expect(result.prepMinutes).toBeGreaterThanOrEqual(10);
      expect(result.prepMinutes).toBeLessThanOrEqual(15);
      expect(result.volumeAdditionMinutes).toBeGreaterThan(0);
    });

    it("adjusts prep time under RUSH and CRITICAL_PEAK modes without exceeding 15 minutes", () => {
      const items: OrderItem[] = [
        { id: "1", name: "Hyderabadi Chicken Biryani", quantity: 3, unitPricePaise: 96000 },
        { id: "2", name: "Tandoori Chicken Full", quantity: 2, unitPricePaise: 70000 },
        { id: "3", name: "Garlic Naan", quantity: 4, unitPricePaise: 24000 },
      ];

      const rushResult = engine.predictKitchenPrepTime({ items, rushMode: "RUSH" });
      expect(rushResult.prepMinutes).toBeGreaterThanOrEqual(12);
      expect(rushResult.prepMinutes).toBeLessThanOrEqual(15);

      const criticalResult = engine.predictKitchenPrepTime({ items, rushMode: "CRITICAL_PEAK" });
      expect(criticalResult.prepMinutes).toBe(15); // Capped at 15 minutes max
    });

    it("auto-accepts order at merchant POS instantly and sets assignment window at Prep - 3 minutes", () => {
      const fixedPlacement = new Date("2026-10-15T13:00:00.000Z");
      const order = engine.placeOrder({
        restaurantId: "rst_101",
        restaurantName: "Tandoori Mahal",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "i1", name: "Chicken Biryani", quantity: 2, unitPricePaise: 60000 }],
        totalAmountPaise: 60000,
        rushMode: "NORMAL",
        placedAt: fixedPlacement,
      });

      expect(order.status).toBe("AUTO_ACCEPTED");
      expect(order.autoAcceptedAt).toBe(fixedPlacement.getTime());
      expect(order.predictedPrepMinutes).toBeGreaterThanOrEqual(8);
      expect(order.predictedPrepMinutes).toBeLessThanOrEqual(15);

      // Verify assignment window is (Prep Time - 3 minutes)
      const expectedWindowMs =
        fixedPlacement.getTime() + (order.predictedPrepMinutes - 3) * 60 * 1000;
      expect(order.assignmentWindowAt).toBe(expectedWindowMs);
      expect(order.expectedReadyAt - order.assignmentWindowAt).toBe(3 * 60 * 1000);
    });
  });

  describe("Rider Assignment Window & Zero Rider Dwell Time", () => {
    it("holds assignment before assignment window is reached to prevent rider idle dwell", () => {
      const dispatch = new AutonomousDispatchEngine();
      const placedAt = 10000000;
      const order = dispatch.placeOrder({
        restaurantId: "rst_taj",
        restaurantName: "Taj Kitchen",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Paneer Tikka", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt,
      });

      const riders: Rider[] = [
        {
          id: "rdr_1",
          name: "Raju Sharma",
          currentLocation: { latitude: 26.146, longitude: 91.737 }, // ~200m away
          isActive: true,
          isAvailable: true,
          assignedOrderId: null,
        },
      ];

      // Time: 1 minute after order placement (way before Prep - 3 min window)
      const evalEarly = dispatch.evaluateRiderAssignment(order.id, placedAt + 60 * 1000, riders);
      expect(evalEarly.assigned).toBe(false);
      expect(evalEarly.assignmentWindowReached).toBe(false);
      expect(evalEarly.minutesUntilAssignmentWindow).toBeGreaterThan(0);
      expect(evalEarly.reason).toContain("Holding assignment");
    });

    it("triggers assignment at assignment window with nearest rider and achieves zero dwell time", () => {
      const dispatch = new AutonomousDispatchEngine();
      const placedAt = 10000000;
      const order = dispatch.placeOrder({
        restaurantId: "rst_taj",
        restaurantName: "Taj Kitchen",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Paneer Tikka", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt,
      });

      const nearRider: Rider = {
        id: "rdr_near",
        name: "Vikram Das",
        currentLocation: { latitude: 26.146, longitude: 91.737 }, // ~200m away
        isActive: true,
        isAvailable: true,
        assignedOrderId: null,
      };

      const farRider: Rider = {
        id: "rdr_far",
        name: "Amit Paul",
        currentLocation: { latitude: 26.16, longitude: 91.75 }, // ~2km away
        isActive: true,
        isAvailable: true,
        assignedOrderId: null,
      };

      // At assignment window timestamp:
      const evalWindow = dispatch.evaluateRiderAssignment(
        order.id,
        order.assignmentWindowAt,
        [farRider, nearRider]
      );

      expect(evalWindow.assigned).toBe(true);
      expect(evalWindow.riderId).toBe("rdr_near"); // Chosen nearest rider
      expect(evalWindow.assignmentWindowReached).toBe(true);
      expect(evalWindow.estimatedDwellMinutes).toBe(0); // Zero rider dwell time

      const updatedOrder = dispatch.getOrder(order.id);
      expect(updatedOrder?.status).toBe("RIDER_ASSIGNED");
      expect(updatedOrder?.assignedRiderId).toBe("rdr_near");
      expect(nearRider.isAvailable).toBe(false);
      expect(nearRider.assignedOrderId).toBe(order.id);
    });
  });

  describe("1.5km Corridor Batching Logic", () => {
    it("batches 2 orders from adjacent restaurants (<300m) along 1.5km corridor within 7 mins", () => {
      const dispatch = new AutonomousDispatchEngine();
      const baseTime = 20000000;

      // Order 1 from Restaurant A
      const order1 = dispatch.placeOrder({
        restaurantId: "rst_A",
        restaurantName: "Biryani Express",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Mutton Biryani", quantity: 1, unitPricePaise: 38000 }],
        totalAmountPaise: 38000,
        placedAt: baseTime,
      });

      // Order 2 from Restaurant Adjacent (150m away, placed 3 minutes later)
      const order2 = dispatch.placeOrder({
        restaurantId: "rst_Adjacent",
        restaurantName: "Rolls & Kebabs",
        pickupLocation: RESTAURANT_ADJACENT,
        dropoffLocation: DROPOFF_CORRIDOR_NEAR, // 700m from Dropoff A
        items: [{ id: "2", name: "Chicken Roll", quantity: 2, unitPricePaise: 24000 }],
        totalAmountPaise: 24000,
        placedAt: baseTime + 3 * 60 * 1000, // 3 mins later (<7 mins)
      });

      const eligibility = dispatch.evaluateBatchEligibility(order1, order2);
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.pickupDistanceMeters).toBeLessThan(300);
      expect(eligibility.corridorDistanceMeters).toBeLessThan(1500);
      expect(eligibility.placementDeltaMinutes).toBe(3);

      const batch = dispatch.batchOrders(order1.id, order2.id);
      expect(batch).not.toBeNull();
      expect(batch?.orderIds).toEqual([order1.id, order2.id]);
      expect(batch?.stops.length).toBe(4); // Pick 1, Pick 2, Drop 1, Drop 2
      expect(batch?.efficiencyGainPercent).toBeGreaterThan(0);

      expect(dispatch.getOrder(order1.id)?.batchId).toBe(batch?.batchId);
      expect(dispatch.getOrder(order2.id)?.batchId).toBe(batch?.batchId);
    });

    it("rejects batching if placement difference exceeds 7 minutes", () => {
      const dispatch = new AutonomousDispatchEngine();
      const baseTime = 20000000;

      const order1 = dispatch.placeOrder({
        restaurantId: "rst_A",
        restaurantName: "Restaurant A",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Food", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt: baseTime,
      });

      const order2 = dispatch.placeOrder({
        restaurantId: "rst_A",
        restaurantName: "Restaurant A",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_CORRIDOR_NEAR,
        items: [{ id: "2", name: "Food 2", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt: baseTime + 8 * 60 * 1000, // 8 mins later (>7 mins)
      });

      const eligibility = dispatch.evaluateBatchEligibility(order1, order2);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reasons.some((r) => r.includes("exceeds 7-minute"))).toBe(true);
      expect(dispatch.batchOrders(order1.id, order2.id)).toBeNull();
    });

    it("rejects batching if dropoff locations exceed 1.5km delivery corridor", () => {
      const dispatch = new AutonomousDispatchEngine();
      const baseTime = 20000000;

      const order1 = dispatch.placeOrder({
        restaurantId: "rst_A",
        restaurantName: "Restaurant A",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Food", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt: baseTime,
      });

      const order2 = dispatch.placeOrder({
        restaurantId: "rst_A",
        restaurantName: "Restaurant A",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_FAR_AWAY, // 5.5km away
        items: [{ id: "2", name: "Food 2", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt: baseTime + 2 * 60 * 1000,
      });

      const eligibility = dispatch.evaluateBatchEligibility(order1, order2);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reasons.some((r) => r.includes("exceeds 1.5km corridor"))).toBe(true);
    });

    it("rejects batching if restaurants are >300m apart", () => {
      const dispatch = new AutonomousDispatchEngine();
      const baseTime = 20000000;

      const order1 = dispatch.placeOrder({
        restaurantId: "rst_A",
        restaurantName: "Restaurant A",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Food", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt: baseTime,
      });

      const orderFarRestaurant = dispatch.placeOrder({
        restaurantId: "rst_Far",
        restaurantName: "Restaurant Far",
        pickupLocation: RESTAURANT_FAR, // 1.8km away (>300m)
        dropoffLocation: DROPOFF_CORRIDOR_NEAR,
        items: [{ id: "2", name: "Food 2", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
        placedAt: baseTime + 2 * 60 * 1000,
      });

      const eligibility = dispatch.evaluateBatchEligibility(order1, orderFarRestaurant);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reasons.some((r) => r.includes("exceeds 300m"))).toBe(true);
    });
  });

  describe("Anti-Idle Re-Dispatch (90 seconds SLA & ₹0 Penalty Waiver)", () => {
    it("does not re-dispatch if rider is within 90 seconds idle threshold", () => {
      const dispatch = new AutonomousDispatchEngine();
      const placedAt = 30000000;
      const order = dispatch.placeOrder({
        restaurantId: "rst_1",
        restaurantName: "Curry Point",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Dal", quantity: 1, unitPricePaise: 15000 }],
        totalAmountPaise: 15000,
        placedAt,
      });

      const riders: Rider[] = [
        {
          id: "rdr_idle",
          name: "Idle Rider",
          currentLocation: { latitude: 26.145, longitude: 91.737 },
          isActive: true,
          isAvailable: true,
          assignedOrderId: null,
        },
      ];

      // Assign rider at window
      dispatch.evaluateRiderAssignment(order.id, order.assignmentWindowAt, riders);

      // Check after 60 seconds (< 90 seconds)
      const res = dispatch.checkAntiIdleAndReDispatch(
        order.id,
        order.assignmentWindowAt + 60 * 1000,
        riders
      );
      expect(res).toBeNull();
      expect(dispatch.getOrder(order.id)?.assignedRiderId).toBe("rdr_idle");
    });

    it("automatically reassigns to next nearest rider after 90 seconds idle with ₹0 penalty waiver and polite notice", () => {
      const dispatch = new AutonomousDispatchEngine();
      const placedAt = 30000000;
      const order = dispatch.placeOrder({
        restaurantId: "rst_1",
        restaurantName: "Curry Point",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Dal", quantity: 1, unitPricePaise: 15000 }],
        totalAmountPaise: 15000,
        placedAt,
      });

      const riderIdle: Rider = {
        id: "rdr_idle",
        name: "Idle Rider",
        currentLocation: { latitude: 26.145, longitude: 91.737 },
        isActive: true,
        isAvailable: true,
        assignedOrderId: null,
      };

      const riderAlternative: Rider = {
        id: "rdr_active",
        name: "Active Next Rider",
        currentLocation: { latitude: 26.147, longitude: 91.739 }, // next nearest
        isActive: true,
        isAvailable: true,
        assignedOrderId: null,
      };

      const riders = [riderIdle, riderAlternative];

      // Assign first rider
      dispatch.evaluateRiderAssignment(order.id, order.assignmentWindowAt, riders);
      expect(order.assignedRiderId).toBe("rdr_idle");

      // Advance time by 95 seconds (>90 seconds anti-idle threshold)
      const reDispatchTime = order.assignmentWindowAt + 95 * 1000;
      const res = dispatch.checkAntiIdleAndReDispatch(order.id, reDispatchTime, riders);

      expect(res).not.toBeNull();
      expect(res?.reDispatched).toBe(true);
      expect(res?.previousRiderId).toBe("rdr_idle");
      expect(res?.newRiderId).toBe("rdr_active");
      expect(res?.idleDurationSeconds).toBe(95);
      expect(res?.penaltyWaived).toBe(true);
      expect(res?.penaltyPaise).toBe(0); // ₹0 penalty waiver
      expect(res?.politeNotice).toContain("Polite notice");
      expect(res?.politeNotice).toContain("₹0 penalty applied");

      // Verify order updated
      const updatedOrder = dispatch.getOrder(order.id);
      expect(updatedOrder?.assignedRiderId).toBe("rdr_active");
      expect(updatedOrder?.reassignmentHistory.length).toBe(1);
      expect(updatedOrder?.reassignmentHistory[0].penaltyWaived).toBe(true);

      // Verify idle rider freed back to available
      expect(riderIdle.isAvailable).toBe(true);
      expect(riderIdle.assignedOrderId).toBeNull();
      // Verify new rider booked
      expect(riderAlternative.isAvailable).toBe(false);
      expect(riderAlternative.assignedOrderId).toBe(order.id);
    });

    it("does not re-dispatch if rider has already started moving towards pickup", () => {
      const dispatch = new AutonomousDispatchEngine();
      const placedAt = 30000000;
      const order = dispatch.placeOrder({
        restaurantId: "rst_1",
        restaurantName: "Curry Point",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Dal", quantity: 1, unitPricePaise: 15000 }],
        totalAmountPaise: 15000,
        placedAt,
      });

      const riderMoving: Rider = {
        id: "rdr_moving",
        name: "Moving Rider",
        currentLocation: { latitude: 26.145, longitude: 91.737 },
        isActive: true,
        isAvailable: true,
        assignedOrderId: null,
      };

      dispatch.evaluateRiderAssignment(order.id, order.assignmentWindowAt, [riderMoving]);

      // Rider starts transit at 30 seconds
      dispatch.notifyRiderMovement(order.id, "rdr_moving");

      // After 120 seconds, anti-idle should not reassign since rider is moving
      const res = dispatch.checkAntiIdleAndReDispatch(
        order.id,
        order.assignmentWindowAt + 120 * 1000,
        [riderMoving]
      );
      expect(res).toBeNull();
      expect(dispatch.getOrder(order.id)?.assignedRiderId).toBe("rdr_moving");
    });
  });

  describe("Autonomous Zero-Human Lifecycle (AUTO_ACCEPTED -> PREPARING -> READY -> RIDER_ASSIGNED -> ON_THE_WAY -> DELIVERED)", () => {
    it("operates the complete 6-stage lifecycle with zero human intervention", () => {
      const dispatch = new AutonomousDispatchEngine();
      const startTime = 50000000;

      // Stage 1: Order Placed -> AUTO_ACCEPTED instantly by Merchant POS
      const order = dispatch.placeOrder({
        restaurantId: "rst_assam_kitchen",
        restaurantName: "Assam Kitchen",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Thali", quantity: 2, unitPricePaise: 40000 }],
        totalAmountPaise: 40000,
        placedAt: startTime,
      });

      expect(order.status).toBe("AUTO_ACCEPTED");

      // Stage 2: Kitchen begins cooking autonomously -> PREPARING
      const preparingOrder = dispatch.transitionToPreparing(order.id, startTime + 10 * 1000);
      expect(preparingOrder.status).toBe("PREPARING");
      const prepLog = preparingOrder.auditLogs.find(
        (l) => l.event === "AUTONOMOUS_TRANSITION_PREPARING"
      );
      expect(prepLog?.detail.zeroHumanIntervention).toBe(true);
      expect(prepLog?.detail.actor).toBe("system");

      // Stage 3: Kitchen finishes cooking according to predictive prep time -> READY
      const readyOrder = dispatch.transitionToReady(
        order.id,
        startTime + order.predictedPrepMinutes * 60 * 1000
      );
      expect(readyOrder.status).toBe("READY");

      // Stage 4: Algorithmic Rider Assignment at assignment window -> RIDER_ASSIGNED
      const rider: Rider = {
        id: "rdr_autonomous_1",
        name: "Deepak Barman",
        currentLocation: { latitude: 26.145, longitude: 91.737 },
        isActive: true,
        isAvailable: true,
        assignedOrderId: null,
      };

      const assignResult = dispatch.evaluateRiderAssignment(
        order.id,
        order.assignmentWindowAt,
        [rider]
      );
      expect(assignResult.assigned).toBe(true);
      expect(assignResult.riderId).toBe("rdr_autonomous_1");
      expect(dispatch.getOrder(order.id)?.status).toBe("RIDER_ASSIGNED");

      // Stage 5: Rider departs pickup with order -> ON_THE_WAY
      const onTheWayOrder = dispatch.transitionToOnTheWay(
        order.id,
        order.assignmentWindowAt + 4 * 60 * 1000
      );
      expect(onTheWayOrder.status).toBe("ON_THE_WAY");
      const onTheWayLog = onTheWayOrder.auditLogs.find(
        (l) => l.event === "AUTONOMOUS_TRANSITION_ON_THE_WAY"
      );
      expect(onTheWayLog?.detail.zeroHumanIntervention).toBe(true);

      // Stage 6: Safe doorstep delivery confirmed -> DELIVERED
      const deliveredOrder = dispatch.transitionToDelivered(
        order.id,
        order.assignmentWindowAt + 18 * 60 * 1000,
        "7842"
      );
      expect(deliveredOrder.status).toBe("DELIVERED");
      const deliveredLog = deliveredOrder.auditLogs.find(
        (l) => l.event === "AUTONOMOUS_TRANSITION_DELIVERED"
      );
      expect(deliveredLog?.detail.zeroHumanIntervention).toBe(true);
      expect(deliveredLog?.detail.handoverOtpVerified).toBe(true);
    });

    it("rejects illegal transitions that violate the zero-human state pipeline", () => {
      const dispatch = new AutonomousDispatchEngine();
      const order = dispatch.placeOrder({
        restaurantId: "rst_assam_kitchen",
        restaurantName: "Assam Kitchen",
        pickupLocation: RESTAURANT_A,
        dropoffLocation: DROPOFF_A,
        items: [{ id: "1", name: "Thali", quantity: 1, unitPricePaise: 20000 }],
        totalAmountPaise: 20000,
      });

      // Cannot jump from AUTO_ACCEPTED directly to DELIVERED or ON_THE_WAY
      expect(() => dispatch.transitionToDelivered(order.id)).toThrow(
        /Invalid zero-human transition/
      );
      expect(() => dispatch.transitionToOnTheWay(order.id)).toThrow(
        /Invalid zero-human transition/
      );
    });
  });
});
