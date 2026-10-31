import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true&connection_limit=1',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT id, name, city, latitude, longitude, is_active FROM restaurants LIMIT 10');
    console.log('RESTAURANTS IN DB:', JSON.stringify(res.rows, null, 2));
    const resItems = await pool.query('SELECT count(*) FROM menu_items');
    console.log('TOTAL MENU ITEMS IN DB:', resItems.rows[0]);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}
run();
