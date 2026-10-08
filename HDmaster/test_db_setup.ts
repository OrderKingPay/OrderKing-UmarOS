import { getSql } from './src/lib/db.ts';

async function run() {
  const sql = await getSql();
  const uId = 'usr_1';
  const zId = 'zne_1';
  const rId = 'rst_1';
  const oId = 'out_1';
  const orderId = 'ord_e2e_123';

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    await sql`INSERT INTO "user" (id, name, email, "emailVerified") VALUES (${uId}, 'Test', 'test@example.com', true) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO profiles (id, user_id, first_name, last_name, email) VALUES (${uId}, ${uId}, 'Test', 'Customer', 'test@example.com') ON CONFLICT DO NOTHING`;
    
    await sql`INSERT INTO organizations (id, name, legal_name) VALUES ('org_1', 'Test', 'Test') ON CONFLICT DO NOTHING`;
    
    await sql`INSERT INTO cities (id, name, state, country_code, currency_code, timezone, data_label, active) VALUES ('city_1', 'Test', 'Test', 'IN', 'INR', 'Asia/Kolkata', 'SIMULATED', true) ON CONFLICT DO NOTHING`;
    
    await sql`INSERT INTO zones (id, org_id, city_id, name, geometry_json, delivery_fee_paise, min_order_paise, max_radius_km, eta_minutes, rider_requirement, restaurant_eligible, customer_available, status) VALUES (${zId}, 'org_1', 'city_1', 'Test', '{}', 0, 0, 10, 30, 1, 1, 1, 'ACTIVE') ON CONFLICT DO NOTHING`;
    
    await sql`INSERT INTO service_zones (id, city_id, name, min_order_paise, delivery_base_paise, delivery_per_km_paise, radius_km, center_lat, center_lng, active) VALUES (${zId}, 'city_1', 'Test', 0, 0, 0, 10, 0, 0, true) ON CONFLICT DO NOTHING`;
    
    await sql`INSERT INTO restaurants (id, slug, name, description_en, description_bn, cuisine_summary, veg_only, rating_count, prep_minutes, commission_bps, packaging_paise, promoted, data_label, active, created_at, udyam_number, dpiit_number, cuisine, address, phone_masked, kyc_status, payout_status, status, data_mode, zone_id, org_id, city_id) VALUES (${rId}, 'test', 'Test', 'en', 'bn', 'c', false, 0, 10, 0, 0, false, 'SIMULATED', true, now(), 'u', 'd', 'c', 'a', 'p', 'APPROVED', 'ACTIVE', 'ACTIVE', 'SIMULATED', ${zId}, 'org_1', 'city_1') ON CONFLICT DO NOTHING`;
    
    await sql`INSERT INTO restaurant_outlets (id, restaurant_id, zone_id, name, address_line, area, lat, lng, data_label, active) VALUES (${oId}, ${rId}, ${zId}, 'Main', '123', 'a', 0, 0, 'SIMULATED', true) ON CONFLICT DO NOTHING`;

    await sql`INSERT INTO orders (id, public_id, user_id, restaurant_id, outlet_id, zone_id, status, payment_method, payment_status, idempotency_key, food_subtotal_paise, restaurant_discount_paise, platform_discount_paise, delivery_fee_paise, service_fee_paise, tax_paise, packaging_paise, total_paise, commission_bps, commission_paise, restaurant_payable_paise, data_label, placed_at, updated_at, food_paise, payment_fee_paise, rider_payout_paise, refund_paise, data_mode, address_snapshot) VALUES (${orderId}, 'ORD-E2E', ${uId}, ${rId}, ${oId}, ${zId}, 'PENDING', 'COD', 'pending', 'idemp1', 45000, 0, 0, 5000, 0, 0, 0, 50000, 0, 0, 50000, 'SIMULATED', now(), now(), 45000, 0, 0, 0, 'SIMULATED', '{}') ON CONFLICT DO NOTHING`;
    
    console.log("DB Setup SUCCESS!");
  } catch (err) {
    console.error("DB setup error:", err);
  }
  process.exit(0);
}
run();
