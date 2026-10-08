require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const rest = await pool.query(`SELECT id FROM restaurants LIMIT 1`);
    const outlet = await pool.query(`SELECT id FROM restaurant_outlets LIMIT 1`);
    const cust = await pool.query(`SELECT id FROM customers LIMIT 1`);
    console.log({
      rest: rest.rows[0]?.id,
      outlet: outlet.rows[0]?.id,
      cust: cust.rows[0]?.id
    });
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
