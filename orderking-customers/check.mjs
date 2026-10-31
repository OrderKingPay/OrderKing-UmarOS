import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true&connection_limit=1');

async function test() {
  const r = await sql`SELECT id, name, city, latitude, longitude, is_active FROM restaurants LIMIT 10`;
  console.log('RESTAURANTS IN DB:', r);
  const m = await sql`SELECT count(*) as count FROM menu_items`;
  console.log('TOTAL MENU ITEMS:', m);
}

test().catch(console.error);
