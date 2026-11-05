import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true';
const pool = new pg.Pool({ connectionString, max: 1 });

async function run() {
  try {
    const res = await pool.query('SELECT * FROM platform_launch_controls');
    console.log("PLATFORM_LAUNCH_CONTROLS:", JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("DB error:", e.message);
  } finally {
    await pool.end();
  }
}
run();
