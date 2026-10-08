require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'orders'`);
  console.log(res.rows.filter(r => r.is_nullable === 'NO' && r.column_default === null));
  process.exit(0);
}
run();
