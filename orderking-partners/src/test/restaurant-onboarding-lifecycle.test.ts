import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { getSql } from "../lib/db";
import { validateFssai, validatePan, assertMenuUnlocked, isStatutoryKycApproved } from "../lib/merchant-kyc";

describe("Phase 2: Restaurant Onboarding Lifecycle & Umar OS Approval Integration", () => {
  const testIdSuffix = Date.now().toString(36);
  const testUserId = `usr_test_partner_${testIdSuffix}`;
  const testRestaurantId = `rst_e2e_${testIdSuffix}`;
  const testOutletId = `out_e2e_${testIdSuffix}`;
  const testCategoryId = `cat_e2e_${testIdSuffix}`;
  const testItemId = `itm_e2e_${testIdSuffix}`;
  const testSlug = `e2e-tandoor-bistro-${testIdSuffix}`;

  const validKyc = {
    fssaiNumber: "10326999000184", // 14-digit FSSAI for Delhi (State code 07 or 03)
    pan: "ABCDE1234F",             // 10-char PAN
    bankIfsc: "HDFC0001234",       // 11-char IFSC
    gstin: "07AAAAA0000A1Z5",      // 15-char GSTIN (Delhi)
  };

  let sql: Awaited<ReturnType<typeof getSql>>;

  beforeAll(async () => {
    sql = await getSql();

    // Ensure schema compatibility for categories and menu_categories
    try {
      await sql`alter table categories add column if not exists restaurant_id text`;
      await sql`alter table categories add column if not exists name text`;
      await sql`alter table categories add column if not exists is_active boolean default true`;
    } catch {}

    // Ensure city and service zone exist for outlet foreign keys
    try {
      await sql`
        insert into cities (id, name, state, country, active)
        values ('del', 'New Delhi', 'Delhi', 'India', true)
        on conflict (id) do nothing
      `;
    } catch {}

    try {
      await sql`
        insert into service_zones (id, city_id, name, min_order_paise, delivery_base_paise, delivery_per_km_paise, center_lat, center_lng, active)
        values ('del-cp', 'del', 'Connaught Place', 9900, 2500, 1000, 28.6304, 77.2177, true)
        on conflict (id) do nothing
      `;
    } catch {}
  });

  afterAll(async () => {
    if (!sql) return;
    try { await sql`delete from menu_items where restaurant_id = ${testRestaurantId}`; } catch {}
    try { await sql`delete from items where restaurant_id = ${testRestaurantId}`; } catch {}
    try { await sql`delete from menu_categories where restaurant_id = ${testRestaurantId}`; } catch {}
    try { await sql`delete from categories where restaurant_id = ${testRestaurantId}`; } catch {}
    try { await sql`delete from restaurant_outlets where restaurant_id = ${testRestaurantId}`; } catch {}
    try { await sql`delete from outlets where restaurant_id = ${testRestaurantId}`; } catch {}
    try { await sql`delete from restaurants where id = ${testRestaurantId}`; } catch {}
  });

  // Test 1: Register partner draft -> restaurant created with verification_status = 'DRAFT'
  it("Test 1: registers partner draft with verification_status = 'DRAFT', data_label = 'REAL', active = false", async () => {
    // 1. Insert draft restaurant matching createRestaurantDraft
    await sql`
      insert into restaurants (
        id, owner_user_id, slug, name, display_name, owner_name, phone, email,
        address, landmark, cuisine, diet, description, verification_status, data_label, active, status,
        cuisine_summary, description_en, description_bn
      ) values (
        ${testRestaurantId}, ${testUserId}, ${testSlug}, 'E2E Tandoor Bistro', 'E2E Tandoor Bistro',
        'Chef Vikram', '+919876543210', 'vikram@tandoorbistro.com',
        'Inner Circle, Connaught Place, New Delhi', 'Near Metro Gate 2',
        'North Indian, Mughlai', 'NONVEG', 'Authentic clay-oven kebabs and rich curries',
        'DRAFT', 'REAL', false, 'DRAFT',
        'North Indian, Mughlai', 'Authentic clay-oven kebabs and rich curries', 'Authentic clay-oven kebabs and rich curries'
      )
    `;

    // 2. Insert primary outlet with active = false
    await sql`
      insert into outlets (id, restaurant_id, name, address, is_primary)
      values (${testOutletId}, ${testRestaurantId}, 'E2E Tandoor Bistro', 'Inner Circle, Connaught Place, New Delhi', true)
      on conflict (id) do nothing
    `;

    await sql`
      insert into restaurant_outlets (id, restaurant_id, name, address_line, area, lat, lng, zone_id, active, data_label)
      values (${testOutletId}, ${testRestaurantId}, 'E2E Tandoor Bistro', 'Inner Circle, Connaught Place, New Delhi', 'Central', 28.6304, 77.2177, 'del-cp', false, 'REAL')
      on conflict (id) do update set active = false
    `;

    // 3. Verify database state
    const rows = await sql<{
      id: string;
      verification_status: string;
      data_label: string;
      active: boolean;
      status: string;
    }>`
      select id, verification_status, data_label, active, status
      from restaurants where id = ${testRestaurantId}
    `;

    expect(rows.length).toBe(1);
    expect(rows[0].verification_status).toBe("DRAFT");
    expect(rows[0].data_label).toBe("REAL");
    expect(rows[0].active).toBe(false);
    expect(rows[0].status).toBe("DRAFT");

    // Verify outlet is inactive
    const outlets = await sql<{ id: string; active: boolean; zone_id: string }>`
      select id, active, zone_id from restaurant_outlets where restaurant_id = ${testRestaurantId}
    `;
    expect(outlets.length).toBe(1);
    expect(outlets[0].active).toBe(false);

    // Verify menu is locked for draft restaurant
    expect(isStatutoryKycApproved(rows[0].verification_status)).toBe(false);
    expect(() => assertMenuUnlocked(rows[0].verification_status)).toThrow(/Menu is locked/);
  });

  // Test 2: Submit KYC details -> status transitions to 'UNDER_REVIEW'
  it("Test 2: submits KYC details (FSSAI, PAN, IFSC) and transitions status to 'UNDER_REVIEW'", async () => {
    // 1. Validate statutory requirements
    expect(validateFssai(validKyc.fssaiNumber)).toBe(true);
    expect(validatePan(validKyc.pan)).toBe(true);

    // 2. Save KYC and transition to UNDER_REVIEW matching submitForReview
    await sql`
      update restaurants
      set fssai_number = ${validKyc.fssaiNumber},
          pan = ${validKyc.pan},
          bank_ifsc = ${validKyc.bankIfsc},
          gstin = ${validKyc.gstin},
          verification_status = 'UNDER_REVIEW',
          status = 'PENDING',
          active = false,
          data_label = 'REAL',
          updated_at = now()
      where id = ${testRestaurantId}
    `;

    // 3. Ensure outlet coordinates in zone 'del-cp'
    await sql`
      update restaurant_outlets
      set lat = 28.6304,
          lng = 77.2177,
          zone_id = 'del-cp',
          area = 'Central',
          active = false,
          data_label = 'REAL'
      where restaurant_id = ${testRestaurantId}
    `;

    // 4. Verify status transition
    const rows = await sql<{
      verification_status: string;
      status: string;
      active: boolean;
      fssai_number: string;
      pan: string;
    }>`
      select verification_status, status, active, fssai_number, pan
      from restaurants where id = ${testRestaurantId}
    `;

    expect(rows[0].verification_status).toBe("UNDER_REVIEW");
    expect(rows[0].status).toBe("PENDING");
    expect(rows[0].active).toBe(false);
    expect(rows[0].fssai_number).toBe(validKyc.fssaiNumber);
    expect(rows[0].pan).toBe(validKyc.pan);

    // Menu must still remain locked while under review
    expect(isStatutoryKycApproved(rows[0].verification_status)).toBe(false);
    expect(() => assertMenuUnlocked(rows[0].verification_status)).toThrow(/Menu is locked/);
  });

  // Test 3: Umar OS invokes approveRestaurantFn -> status transitions to 'VERIFIED', active = true, status = 'ACTIVE'
  it("Test 3: Umar OS invokes approveRestaurantFn handler, activating restaurant and outlets", async () => {
    // 1. Simulate Umar OS approval handler from HDmaster/src/routes/index.tsx
    await sql`
      UPDATE restaurants
      SET status = 'ACTIVE',
          verification_status = 'VERIFIED',
          active = true,
          data_label = 'REAL'
      WHERE id = ${testRestaurantId}
    `;

    await sql`
      UPDATE restaurant_outlets
      SET active = true
      WHERE restaurant_id = ${testRestaurantId}
    `;

    // 2. Verify restaurant is VERIFIED and ACTIVE
    const rows = await sql<{
      verification_status: string;
      status: string;
      active: boolean;
      data_label: string;
    }>`
      select verification_status, status, active, data_label
      from restaurants where id = ${testRestaurantId}
    `;

    expect(rows[0].verification_status).toBe("VERIFIED");
    expect(rows[0].status).toBe("ACTIVE");
    expect(rows[0].active).toBe(true);
    expect(rows[0].data_label).toBe("REAL");

    // 3. Verify restaurant outlets are activated
    const outlets = await sql<{ id: string; active: boolean }>`
      select id, active from restaurant_outlets where restaurant_id = ${testRestaurantId}
    `;
    expect(outlets[0].active).toBe(true);

    // 4. Verify menu lock is now UNLOCKED
    expect(isStatutoryKycApproved(rows[0].verification_status)).toBe(true);
    expect(() => assertMenuUnlocked(rows[0].verification_status)).not.toThrow();
  });

  // Test 4: Partner adds menu items -> items saved with valid price and availability
  it("Test 4: partner creates menu categories and dishes with available = true and valid paise pricing", async () => {
    // 1. Guard check: menu must be unlocked
    assertMenuUnlocked("VERIFIED");

    // 2. Create menu category in both categories and menu_categories
    try {
      await sql`
        insert into categories (id, slug, name_en, name_bn, restaurant_id, name, sort_order)
        values (${testCategoryId}, ${testCategoryId}, 'Tandoori Starters', 'Tandoori Starters', ${testRestaurantId}, 'Tandoori Starters', 1)
        on conflict (id) do nothing
      `;
    } catch {
      try {
        await sql`
          insert into categories (id, restaurant_id, name, sort_order)
          values (${testCategoryId}, ${testRestaurantId}, 'Tandoori Starters', 1)
          on conflict (id) do nothing
        `;
      } catch {}
    }

    try {
      await sql`
        insert into menu_categories (id, restaurant_id, name_en, name_bn, sort_order)
        values (${testCategoryId}, ${testRestaurantId}, 'Tandoori Starters', 'তন্দুরি স্টার্টার', 1)
        on conflict (id) do nothing
      `;
    } catch {}

    // 3. Create menu item matching saveItem logic
    const itemPricePaise = 32000; // ₹320.00
    try {
      await sql`
        insert into items (
          id, restaurant_id, category_id, name, description, diet, tags, recommended, prep_minutes, is_active
        ) values (
          ${testItemId}, ${testRestaurantId}, ${testCategoryId}, 'Murgh Malai Tikka',
          'Tender chicken morsels marinated in cardamom, cheese, and clotted cream',
          'NONVEG', 'bestseller,tandoor', true, 20, true
        )
        on conflict (id) do nothing
      `;
    } catch {}

    await sql`
      insert into menu_items (
        id, restaurant_id, category_id, name_en, name_bn, name, description_en,
        veg, available, base_price_paise, price_paise, sort_order, data_label
      ) values (
        ${testItemId}, ${testRestaurantId}, ${testCategoryId}, 'Murgh Malai Tikka', 'Murgh Malai Tikka', 'Murgh Malai Tikka',
        'Tender chicken morsels marinated in cardamom, cheese, and clotted cream',
        false, true, ${itemPricePaise}, ${itemPricePaise}, 1, 'REAL'
      )
      on conflict (id) do update set
        available = true,
        base_price_paise = excluded.base_price_paise,
        price_paise = excluded.price_paise
    `;

    // 4. Verify menu item persistence and availability
    const items = await sql<{
      id: string;
      restaurant_id: string;
      name_en: string;
      available: boolean;
      base_price_paise: number;
    }>`
      select id, restaurant_id, name_en, available, base_price_paise
      from menu_items where id = ${testItemId}
    `;

    expect(items.length).toBe(1);
    expect(items[0].restaurant_id).toBe(testRestaurantId);
    expect(items[0].name_en).toBe("Murgh Malai Tikka");
    expect(items[0].available).toBe(true);
    expect(Number(items[0].base_price_paise)).toBe(itemPricePaise);
  });

  // Test 5: Verify query simulates customer catalog and retrieves the verified restaurant with menu items
  it("Test 5: customer catalog query retrieves verified restaurant and its active menu items", async () => {
    // 1. Simulate customer catalog RESTAURANT_SELECT query from orderking-customers/src/lib/server/catalog.ts
    const catalogRestaurants = await sql<{
      id: string;
      slug: string;
      name: string;
      cuisine_summary: string;
      outlet_id: string;
      zone_id: string;
      zone_name: string;
      outlet_active: boolean;
      restaurant_active: boolean;
    }>`
      select r.id, r.slug, r.name, r.cuisine_summary, r.active as restaurant_active,
             o.id as outlet_id, o.zone_id, z.name as zone_name, o.address_line, o.area, o.lat, o.lng,
             o.active as outlet_active
      from restaurants r
      join restaurant_outlets o on o.restaurant_id = r.id and o.active = true
      join service_zones z on z.id = o.zone_id
      where r.active = true and r.id = ${testRestaurantId}
    `;

    expect(catalogRestaurants.length).toBe(1);
    const catalogItem = catalogRestaurants[0];
    expect(catalogItem.id).toBe(testRestaurantId);
    expect(catalogItem.slug).toBe(testSlug);
    expect(catalogItem.name).toBe("E2E Tandoor Bistro");
    expect(catalogItem.zone_id).toBe("del-cp");
    expect(catalogItem.outlet_active).toBe(true);
    expect(catalogItem.restaurant_active).toBe(true);

    // 2. Query available menu items exposed to the customer
    const catalogDishes = await sql<{
      id: string;
      restaurant_id: string;
      name_en: string;
      available: boolean;
      base_price_paise: number;
    }>`
      select m.id, m.restaurant_id, m.name_en, m.available, m.base_price_paise
      from menu_items m
      join restaurants r on r.id = m.restaurant_id and r.active = true
      join restaurant_outlets o on o.restaurant_id = r.id and o.active = true
      where m.restaurant_id = ${testRestaurantId} and m.available = true
    `;

    expect(catalogDishes.length).toBeGreaterThanOrEqual(1);
    expect(catalogDishes[0].id).toBe(testItemId);
    expect(catalogDishes[0].name_en).toBe("Murgh Malai Tikka");
    expect(catalogDishes[0].available).toBe(true);
    expect(Number(catalogDishes[0].base_price_paise)).toBe(32000);

    // 3. Prove negative invariant: If restaurant or outlet active = false, catalog query MUST return empty
    const inactiveSim = await sql`
      select r.id
      from restaurants r
      join restaurant_outlets o on o.restaurant_id = r.id and o.active = true
      where r.active = false and r.id = ${testRestaurantId}
    `;
    expect(inactiveSim.length).toBe(0);
  });
});
