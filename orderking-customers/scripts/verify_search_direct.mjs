import pg from "pg";
import fs from "fs";

// Load .env
try {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {
  console.log("Error reading .env", e);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function verify() {
  const client = await pool.connect();
  try {
    console.log("=== VERIFYING DB INSERTS FOR CONNAUGHT PLACE (del-cp) ===");
    
    const launch = await client.query("SELECT org_id, public_launch, controlled_pilot, dispatch_enabled, rider_gps_enabled, payments_mode, data_mode FROM platform_launch_controls WHERE org_id = 'org_orderking'");
    console.log("\n1. platform_launch_controls:", launch.rows[0]);

    const city = await client.query("SELECT id, name, state, data_label, active FROM cities WHERE id = 'del'");
    console.log("\n2. City:", city.rows[0]);

    const zone = await client.query("SELECT id, city_id, name, min_order_paise, delivery_base_paise, delivery_per_km_paise, radius_km, center_lat, center_lng, active FROM service_zones WHERE id = 'del-cp'");
    console.log("\n3. Service Zone:", zone.rows[0]);

    const cats = await client.query("SELECT id, slug, name_en, active FROM categories ORDER BY sort_order");
    console.log("\n4. Categories (count: " + cats.rows.length + "):", cats.rows);

    const rsts = await client.query(`
      SELECT r.id, r.name, r.cuisine_summary, r.veg_only, r.rating_avg, r.rating_count, r.kyc_status, r.data_mode, r.active,
             o.id as outlet_id, o.name as outlet_name, o.area, o.fssai_number, o.lat, o.lng, o.open_override
      FROM restaurants r
      JOIN restaurant_outlets o ON o.restaurant_id = r.id
      WHERE o.zone_id = 'del-cp'
      ORDER BY r.rating_avg DESC;
    `);
    console.log("\n5. Connaught Place Restaurants (count: " + rsts.rows.length + "):");
    console.table(rsts.rows.map(r => ({
      name: r.name,
      rating: r.rating_avg,
      fssai: r.fssai_number,
      area: r.area,
      kyc: r.kyc_status,
      data_mode: r.data_mode,
      active: r.active
    })));

    const rdrs = await client.query(`
      SELECT user_id, full_name, phone, online, status, kyc_status, data_mode, zone_id, vehicle_type
      FROM riders
      WHERE zone_id = 'del-cp' AND online = 1 AND data_mode = 'LIVE';
    `);
    console.log("\n6. Online Live Fleet Riders in del-cp (count: " + rdrs.rows.length + "):");
    console.table(rdrs.rows);

    const menu = await client.query(`
      SELECT m.id, r.name as restaurant_name, m.name_en, m.base_price_paise, m.veg, m.bestseller, m.data_label
      FROM menu_items m
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.zone_id = 'del-cp'
      ORDER BY r.name, m.sort_order;
    `);
    console.log("\n7. Sample Menu Items in del-cp (count: " + menu.rows.length + "):");
    console.table(menu.rows.slice(0, 10));

  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(console.error);
