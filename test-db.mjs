import { getSql } from './orderking-customers/src/lib/db.ts';
async function test() {
  const sql = await getSql();
  const res = await sql`SELECT m.id, m.name, m.price_paise, m.veg, r.name as restaurant_name
                         FROM menu_items m
                         JOIN restaurants r ON r.id = m.restaurant_id
                         WHERE r.data_mode = 'LIVE' AND r.active = true
                         LIMIT 15`;
  console.log("Menu items count:", res.length);
  console.log(res);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
