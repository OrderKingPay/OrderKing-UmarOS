import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getSql } from "../../db.ts";
import { runAlgorithmicAutoDispatch } from "./auto-dispatch-engine.server.ts";
import {
  getCurrentEcosystemShift,
  checkThreatZoneIntersections,
  CANONICAL_THREAT_ZONES,
} from "../../../../../packages/ui/src/ecosystem-shifts.ts";

describe("Autonomous Algorithmic AI Dispatch Engine & Shift Curfew Verification", () => {
  const testOrgId = `org_dispatch_test_${Date.now()}`;
  const testCityId = `city_dispatch_test_${Date.now()}`;
  const testZoneId = `zone_dispatch_test_${Date.now()}`;
  const testRestId = `rst_dispatch_test_${Date.now()}`;
  const testCustId = `cst_dispatch_test_${Date.now()}`;
  const testOrderId = `ord_dispatch_test_${Date.now()}`;
  const testRiderCloseId = `rdr_dispatch_close_${Date.now()}`;
  const testRiderFarId = `rdr_dispatch_far_${Date.now()}`;
  const testRiderCurfewId = `rdr_dispatch_curfew_${Date.now()}`;

  beforeAll(async () => {
    const sql = await getSql();

    // 1. Seed test organization, city, zone, and restaurant (Karimganj Core: 24.8688, 92.3511)
    await sql`
      INSERT INTO organizations (id, name, slug)
      VALUES (${testOrgId}, 'Dispatch Test Org', ${testOrgId})
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO cities (id, org_id, name, state, lat, lng)
      VALUES (${testCityId}, ${testOrgId}, 'Karimganj', 'Assam', 24.8688, 92.3511)
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO zones (id, org_id, city_id, name)
      VALUES (${testZoneId}, ${testOrgId}, ${testCityId}, 'Karimganj Central Zone')
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO restaurants (id, org_id, city_id, zone_id, name, phone, address, lat, lng, status)
      VALUES (
        ${testRestId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Spice Sovereign Kitchen', '+919395065587', 'Station Road, Karimganj',
        24.8688, 92.3511, 'ACTIVE'
      )
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO customers (id, org_id, city_id, display_ref, phone_masked, status)
      VALUES (${testCustId}, ${testOrgId}, ${testCityId}, 'Test Cust', '+91-9395065587', 'ACTIVE')
      ON CONFLICT DO NOTHING
    `;
  });

  afterAll(async () => {
    const sql = await getSql();
    // Clean up created test entities
    await sql`DELETE FROM order_events WHERE org_id = ${testOrgId}`;
    await sql`DELETE FROM orders WHERE org_id = ${testOrgId}`;
    await sql`DELETE FROM riders WHERE org_id = ${testOrgId}`;
    await sql`DELETE FROM customers WHERE id = ${testCustId}`;
    await sql`DELETE FROM restaurants WHERE id = ${testRestId}`;
    await sql`DELETE FROM zones WHERE id = ${testZoneId}`;
    await sql`DELETE FROM cities WHERE id = ${testCityId}`;
    await sql`DELETE FROM organizations WHERE id = ${testOrgId}`;
  });

  it("1. Dynamically bounds dispatch matching radius to active shift limits (Day: 12km, Evening: 7.5km, Night: 3.5km)", () => {
    const currentShift = getCurrentEcosystemShift();
    expect(currentShift).toBeDefined();
    expect(["DAY", "EVENING", "LATE_NIGHT"]).toContain(currentShift.type);

    if (currentShift.type === "DAY") {
      expect(currentShift.maxRadiusKm).toBe(12.0);
    } else if (currentShift.type === "EVENING") {
      expect(currentShift.maxRadiusKm).toBe(7.5);
    } else if (currentShift.type === "LATE_NIGHT") {
      expect(currentShift.maxRadiusKm).toBe(3.5);
    }
  });

  it("2. Accurately evaluates threat exclusion curfew boundaries", () => {
    // Karimganj / Bangladesh international border perimeter (threat_outer_border_perimeter)
    const borderLat = 24.8720;
    const borderLng = 92.3680;
    const intersections = checkThreatZoneIntersections(borderLat, borderLng);
    expect(intersections.length).toBeGreaterThanOrEqual(1);

    const borderZone = intersections.find((z) => z.id === "threat_outer_border_perimeter");
    expect(borderZone).toBeDefined();
    expect(borderZone!.threatLevel).toBe("EXCLUSION_CURFEW");
  });

  it("3. Executes autonomous zero-human dispatch matching closest eligible in-radius rider", async () => {
    const sql = await getSql();

    // Rider 1: Close in-radius rider (Karimganj Main Market: 24.8695, 92.3520 ~ 130m away)
    await sql`
      INSERT INTO riders (id, org_id, city_id, zone_id, name, phone_masked, vehicle, status, online, lat, lng)
      VALUES (
        ${testRiderCloseId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider A (Close)', '+91-9395065587', 'EV Scooter', 'ACTIVE', 1,
        24.8695, 92.3520
      )
    `;

    // Rider 2: Far out-of-radius rider (Badarpur Ghat: 24.9000, 92.5400 ~ 20km away)
    await sql`
      INSERT INTO riders (id, org_id, city_id, zone_id, name, phone_masked, vehicle, status, online, lat, lng)
      VALUES (
        ${testRiderFarId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider B (Far)', '+91-9395065588', 'Motorcycle', 'ACTIVE', 1,
        24.9000, 92.5400
      )
    `;

    // Insert a test order ready for dispatch
    await sql`
      INSERT INTO orders (
        id, org_id, city_id, zone_id, restaurant_id, customer_id,
        status, payment_status, payment_method, food_paise, total_paise
      ) VALUES (
        ${testOrderId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
        'READY', 'PAID', 'UPI', 45000, 45000
      )
    `;

    // Run the autonomous AI dispatch engine without any human intervention
    const result = await runAlgorithmicAutoDispatch();

    expect(result.assignedOrders).toBeGreaterThanOrEqual(1);
    const assignedMatch = result.matchedPairs.find((m) => m.orderId === testOrderId);
    expect(assignedMatch).toBeDefined();
    expect(assignedMatch!.riderId).toBe(testRiderCloseId);
    expect(assignedMatch!.distanceKm).toBeLessThan(1.0);
    expect(assignedMatch!.etaMinutes).toBeGreaterThanOrEqual(3); // 3m pickup buffer + travel

    // Verify order in database transitioned to RIDER_ASSIGNED
    const orderRows = await sql<{ status: string; rider_id: string }>`
      SELECT status, rider_id FROM orders WHERE id = ${testOrderId} LIMIT 1
    `;
    expect(orderRows[0]!.status).toBe("RIDER_ASSIGNED");
    expect(orderRows[0]!.rider_id).toBe(testRiderCloseId);

    // Verify immutable audit event written to order_events
    const eventRows = await sql<{ action: string; note: string }>`
      SELECT action, note FROM order_events WHERE order_id = ${testOrderId} AND action = 'AUTO_DISPATCH' LIMIT 1
    `;
    expect(eventRows).toHaveLength(1);
    expect(eventRows[0]!.action).toBe("AUTO_DISPATCH");
    expect(eventRows[0]!.note).toContain(`AI assigned Rider ${testRiderCloseId}`);
  });

  it("4. Prevents dispatch assignment to riders positioned in EXCLUSION_CURFEW threat zones", async () => {
    const sql = await getSql();
    const curfewOrderId = `ord_curfew_test_${Date.now()}`;

    // Create a rider inside the curfew zone (threat_outer_border_perimeter)
    await sql`
      INSERT INTO riders (id, org_id, city_id, zone_id, name, phone_masked, vehicle, status, online, lat, lng)
      VALUES (
        ${testRiderCurfewId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider Curfew', '+91-9395065589', 'EV Scooter', 'ACTIVE', 1,
        24.8720, 92.3680
      )
    `;

    // Insert unassigned order near the curfew border
    await sql`
      INSERT INTO orders (
        id, org_id, city_id, zone_id, restaurant_id, customer_id,
        status, payment_status, payment_method, food_paise, total_paise
      ) VALUES (
        ${curfewOrderId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
        'READY', 'PAID', 'UPI', 25000, 25000
      )
    `;

    // Make Rider A offline so only Curfew Rider or Far Rider exist
    await sql`UPDATE riders SET online = 0 WHERE id = ${testRiderCloseId}`;

    // Run dispatch engine
    const result = await runAlgorithmicAutoDispatch();

    // Curfew rider MUST NOT be assigned
    const curfewMatch = result.matchedPairs.find((m) => m.orderId === curfewOrderId);
    if (curfewMatch) {
      expect(curfewMatch.riderId).not.toBe(testRiderCurfewId);
    }

    // Verify curfew order was not assigned to curfew rider
    const checkOrder = await sql<{ rider_id: string | null }>`
      SELECT rider_id FROM orders WHERE id = ${curfewOrderId} LIMIT 1
    `;
    expect(checkOrder[0]?.rider_id).not.toBe(testRiderCurfewId);

    // Clean up
    await sql`DELETE FROM orders WHERE id = ${curfewOrderId}`;
  });

  it("5. Capacity enforcement: excludes riders with active_count >= 2 from new batch dispatches", async () => {
    const sql = await getSql();

    // Rider with 2 active orders
    const loadedRiderId = `rdr_loaded_${Date.now()}`;
    await sql`
      INSERT INTO riders (id, org_id, city_id, zone_id, name, phone_masked, vehicle, status, online, lat, lng)
      VALUES (
        ${loadedRiderId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider Overloaded', '+91-9395065590', 'Bike', 'ACTIVE', 1,
        24.8690, 92.3515
      )
    `;

    // Assign 2 active orders to this rider
    const ord1 = `ord_load_1_${Date.now()}`;
    const ord2 = `ord_load_2_${Date.now()}`;
    await sql`
      INSERT INTO orders (id, org_id, city_id, zone_id, restaurant_id, customer_id, status, payment_status, payment_method, food_paise, total_paise, rider_id)
      VALUES
        (${ord1}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId}, 'RIDER_ASSIGNED', 'PAID', 'UPI', 10000, 10000, ${loadedRiderId}),
        (${ord2}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId}, 'RIDER_ASSIGNED', 'PAID', 'UPI', 10000, 10000, ${loadedRiderId})
    `;

    // Create a 3rd order that needs dispatch
    const pendingOrd = `ord_load_3_${Date.now()}`;
    await sql`
      INSERT INTO orders (id, org_id, city_id, zone_id, restaurant_id, customer_id, status, payment_status, payment_method, food_paise, total_paise)
      VALUES (${pendingOrd}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId}, 'READY', 'PAID', 'UPI', 10000, 10000)
    `;

    // Run dispatch
    const result = await runAlgorithmicAutoDispatch();
    const match = result.matchedPairs.find((m) => m.orderId === pendingOrd);

    // Overloaded rider must not be assigned
    if (match) {
      expect(match.riderId).not.toBe(loadedRiderId);
    }

    // Clean up
    await sql`DELETE FROM orders WHERE id IN (${ord1}, ${ord2}, ${pendingOrd})`;
  });
});
