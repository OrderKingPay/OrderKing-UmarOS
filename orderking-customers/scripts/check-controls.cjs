const pg = require('pg');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true';
console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new pg.Pool({ connectionString, max: 1 });

async function main() {
  try {
    const res = await pool.query('SELECT * FROM platform_launch_controls');
    console.log('ROWS:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await pool.end();
  }
}
main();
