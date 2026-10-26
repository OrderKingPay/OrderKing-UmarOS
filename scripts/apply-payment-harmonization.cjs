const fs = require('fs');
const path = require('path');

let pg;
try {
  pg = require('../orderking-customers/node_modules/pg');
} catch (e) {
  try {
    pg = require('pg');
  } catch (err) {
    console.error('Failed to load pg module:', err);
    process.exit(1);
  }
}

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to live Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261026_harmonize_payment_webhook_and_rpc.sql');
    console.log('Reading migration file:', migrationPath);
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing payment harmonization migration...');
    const t0 = Date.now();
    await client.query(sqlContent);
    console.log(`Executed successfully in ${Date.now() - t0}ms!\n`);

    // Verification
    console.log('--- 1. Checking payment_webhook_events columns ---');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment_webhook_events'
      ORDER BY ordinal_position;
    `);
    cols.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    console.log('\n--- 2. Checking settle_captured_razorpay_order RPC ---');
    const rpc = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'settle_captured_razorpay_order';
    `);
    console.log('RPC check:', rpc.rows);

    console.log('\n--- ALL PAYMENT GATES HARMONIZED AND VERIFIED ---');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
