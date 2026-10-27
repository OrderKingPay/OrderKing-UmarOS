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
      INSERT INTO organizations (id, name, legal_name)
      VALUES (${testOrgId}, 'Dispatch Test Org', 'Dispatch Test Org LLC')
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO cities (id, name, state)
      VALUES (${testCityId}, 'Karimganj', 'Assam')
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO zones (id, org_id, city_id, name)
      VALUES (${testZoneId}, ${testOrgId}, ${testCityId}, 'Karimganj Central Zone')
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO restaurants (id, org_id, city_id, zone_id, name, slug, description_en, description_bn, cuisine_summary, address, phone_masked, lat, lng, status)
      VALUES (
        ${testRestId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Spice Sovereign Kitchen', ${testRestId}, 'Authentic Indian Food', 'খাঁটি ভারতীয় খাবার', 'Indian, Bengali', 'Station Road, Karimganj',
        '+919395065587', 24.8688, 92.3511, 'ACTIVE'
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
    const borderLat = 24.8900;
    const borderLng = 92.3680;
    const eveningDate = new Date("2026-10-27T20:00:00+05:30");
    const intersections = checkThreatZoneIntersections(borderLat, borderLng, eveningDate);
    expect(intersections.length).toBeGreaterThanOrEqual(1);

    const borderZone = intersections.find((z) => z.id === "threat_outer_border_perimeter");
    expect(borderZone).toBeDefined();
    expect(borderZone!.threatLevel).toBe("EXCLUSION_CURFEW");
  });

  it("3. Executes autonomous zero-human dispatch matching closest eligible in-radius rider", async () => {
    const sql = await getSql();

    // Rider 1: Close in-radius rider (Karimganj Main Market: 24.8695, 92.3520 ~ 130m away)
    await sql`
      INSERT INTO riders (id, user_id, org_id, city_id, zone_id, full_name, phone, vehicle_type, status, online, lat, lng)
      VALUES (
        ${testRiderCloseId}, ${testRiderCloseId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider A (Close)', '+91-9395065587', 'EV Scooter', 'ACTIVE', 1,
        24.8695, 92.3520
      )
    `;

    // Rider 2: Far out-of-radius rider (Badarpur Ghat: 24.9000, 92.5400 ~ 20km away)
    await sql`
      INSERT INTO riders (id, user_id, org_id, city_id, zone_id, full_name, phone, vehicle_type, status, online, lat, lng)
      VALUES (
        ${testRiderFarId}, ${testRiderFarId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider B (Far)', '+91-9395065588', 'Motorcycle', 'ACTIVE', 1,
        24.9000, 92.5400
      )
    `;

    // Insert a test order ready for dispatch
    const testPublicId = `ORD-${Date.now()}`;
    const testAddressSnapshot = JSON.stringify({ address: "Station Road, Karimganj", lat: 24.8700, lng: 92.3520 });
    await sql`
      INSERT INTO orders (
        id, public_id, user_id, org_id, city_id, zone_id, restaurant_id, customer_id,
        address_snapshot, status, payment_status, payment_method, idempotency_key,
        food_subtotal_paise, delivery_fee_paise, total_paise,
        commission_bps, commission_paise, restaurant_payable_paise, placed_at
      ) VALUES (
        ${testOrderId}, ${testPublicId}, ${testCustId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
        ${testAddressSnapshot}, 'READY', 'PAID', 'UPI', ${`idem_${testOrderId}`},
        45000, 3500, 48500,
        1000, 4500, 40500, NOW()
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
      INSERT INTO riders (id, user_id, org_id, city_id, zone_id, full_name, phone, vehicle_type, status, online, lat, lng)
      VALUES (
        ${testRiderCurfewId}, ${testRiderCurfewId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider Curfew', '+91-9395065589', 'EV Scooter', 'ACTIVE', 1,
        24.8900, 92.3680
      )
    `;

    // Insert unassigned order near the curfew border
    const curfewPublicId = `ORD-CURFEW-${Date.now()}`;
    const curfewAddressSnapshot = JSON.stringify({ address: "Curfew Border Sector", lat: 24.8900, lng: 92.3680 });
    await sql`
      INSERT INTO orders (
        id, public_id, user_id, org_id, city_id, zone_id, restaurant_id, customer_id,
        address_snapshot, status, payment_status, payment_method, idempotency_key,
        food_subtotal_paise, delivery_fee_paise, total_paise,
        commission_bps, commission_paise, restaurant_payable_paise, placed_at
      ) VALUES (
        ${curfewOrderId}, ${curfewPublicId}, ${testCustId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
        ${curfewAddressSnapshot}, 'READY', 'PAID', 'UPI', ${`idem_${curfewOrderId}`},
        25000, 3500, 28500,
        1000, 2500, 22500, NOW()
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
      INSERT INTO riders (id, user_id, org_id, city_id, zone_id, full_name, phone, vehicle_type, status, online, lat, lng)
      VALUES (
        ${loadedRiderId}, ${loadedRiderId}, ${testOrgId}, ${testCityId}, ${testZoneId},
        'Rider Overloaded', '+91-9395065590', 'Bike', 'ACTIVE', 1,
        24.8690, 92.3515
      )
    `;

    // Assign 2 active orders to this rider
    const ord1 = `ord_load_1_${Date.now()}`;
    const ord2 = `ord_load_2_${Date.now()}`;
    const testSnap = JSON.stringify({ address: "Market Area", lat: 24.8690, lng: 92.3515 });
    await sql`
      INSERT INTO orders (
        id, public_id, user_id, org_id, city_id, zone_id, restaurant_id, customer_id,
        address_snapshot, status, payment_status, payment_method, idempotency_key,
        food_subtotal_paise, delivery_fee_paise, total_paise,
        commission_bps, commission_paise, restaurant_payable_paise, rider_id, placed_at
      ) VALUES
        (${ord1}, ${`PUB-${ord1}`}, ${testCustId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
         ${testSnap}, 'RIDER_ASSIGNED', 'PAID', 'UPI', ${`idem_${ord1}`}, 10000, 3500, 13500, 1000, 1000, 9000, ${loadedRiderId}, NOW()),
        (${ord2}, ${`PUB-${ord2}`}, ${testCustId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
         ${testSnap}, 'RIDER_ASSIGNED', 'PAID', 'UPI', ${`idem_${ord2}`}, 10000, 3500, 13500, 1000, 1000, 9000, ${loadedRiderId}, NOW())
    `;

    // Create a 3rd order that needs dispatch
    const pendingOrd = `ord_load_3_${Date.now()}`;
    await sql`
      INSERT INTO orders (
        id, public_id, user_id, org_id, city_id, zone_id, restaurant_id, customer_id,
        address_snapshot, status, payment_status, payment_method, idempotency_key,
        food_subtotal_paise, delivery_fee_paise, total_paise,
        commission_bps, commission_paise, restaurant_payable_paise, placed_at
      ) VALUES (
        ${pendingOrd}, ${`PUB-${pendingOrd}`}, ${testCustId}, ${testOrgId}, ${testCityId}, ${testZoneId}, ${testRestId}, ${testCustId},
        ${testSnap}, 'READY', 'PAID', 'UPI', ${`idem_${pendingOrd}`}, 10000, 3500, 13500, 1000, 1000, 9000, NOW()
      )
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
