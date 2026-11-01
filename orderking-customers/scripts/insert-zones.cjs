const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true&connection_limit=1",
});

async function main() {
  try {
    // 1. Insert cities if missing
    await pool.query(`
      INSERT INTO cities (id, name, state, country_code, currency_code, timezone, data_label, active)
      VALUES 
        ('city_guwahati', 'Guwahati', 'Assam', 'IN', 'INR', 'Asia/Kolkata', 'LIVE', true),
        ('city_silchar', 'Silchar', 'Assam', 'IN', 'INR', 'Asia/Kolkata', 'LIVE', true)
      ON CONFLICT (id) DO UPDATE SET active = true, data_label = 'LIVE';
    `);
    console.log("SUCCESS: Cities verified.");

    // 2. Insert service zones
    const sql = `
      INSERT INTO service_zones (id, city_id, name, center_lat, center_lng, radius_km, delivery_base_paise, delivery_per_km_paise, delivery_free_over_paise, min_order_paise, active)
      VALUES 
        ('karimganj_core', 'city_karimganj', 'Karimganj / Sribhumi Core', 24.8688, 92.3511, 25.0, 2500, 500, 30000, 9900, true),
        ('guwahati_core', 'city_guwahati', 'Guwahati Central Hub', 26.1445, 91.7362, 35.0, 2500, 500, 30000, 9900, true),
        ('silchar_core', 'city_silchar', 'Silchar Central Hub', 24.8333, 92.7789, 25.0, 2500, 500, 30000, 9900, true)
      ON CONFLICT (id) DO UPDATE SET active = true, radius_km = EXCLUDED.radius_km;
    `;
    await pool.query(sql);
    console.log("SUCCESS: Inserted/Updated service_zones for Karimganj, Guwahati, Silchar.");

    // 3. Link existing restaurants to Karimganj, Guwahati, Silchar outlets
    const rsts = await pool.query("SELECT id, name FROM restaurants LIMIT 8");
    console.log("Restaurants found:", rsts.rows);

    for (const r of rsts.rows) {
      // Karimganj outlet
      await pool.query(`
        INSERT INTO restaurant_outlets (id, restaurant_id, name, address_line, area, lat, lng, zone_id, active)
        VALUES ($1, $2, $3, 'Station Road, Karimganj', 'Karimganj Town', 24.8688, 92.3511, 'karimganj_core', true)
        ON CONFLICT (id) DO UPDATE SET active = true, zone_id = 'karimganj_core', lat = 24.8688, lng = 92.3511;
      `, [`out_kj_${r.id}`, r.id, `${r.name} (Karimganj)`]);

      // Guwahati outlet
      await pool.query(`
        INSERT INTO restaurant_outlets (id, restaurant_id, name, address_line, area, lat, lng, zone_id, active)
        VALUES ($1, $2, $3, 'GS Road, Guwahati', 'Guwahati Hub', 26.1445, 91.7362, 'guwahati_core', true)
        ON CONFLICT (id) DO UPDATE SET active = true, zone_id = 'guwahati_core', lat = 26.1445, lng = 91.7362;
      `, [`out_gh_${r.id}`, r.id, `${r.name} (Guwahati)`]);
    }
    console.log("SUCCESS: Linked outlets in Karimganj and Guwahati zones.");

    const zones = await pool.query("SELECT id, name, radius_km, active FROM service_zones");
    console.log("All zones now:", zones.rows);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

main();
