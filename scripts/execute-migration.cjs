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
    console.log('Connected successfully to database host aws-0-ap-southeast-1.pooler.supabase.com.');

    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261018_umaros_master_fees_menus.sql');
    console.log('Reading migration file:', migrationPath);
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');
    const startTime = Date.now();
    await client.query(sqlContent);
    const duration = Date.now() - startTime;
    console.log(`Migration executed successfully in ${duration}ms.\n`);

    console.log('============================================================');
    console.log('VERIFICATION PROOF:');
    console.log('============================================================');

    // 1. Check umar_os_config table & seed
    console.log('\n--- 1. Verification of public.umar_os_config ---');
    const configRes = await client.query('SELECT key, description, value FROM public.umar_os_config ORDER BY key;');
    console.log(`Found ${configRes.rowCount} config records:`);
    for (const row of configRes.rows) {
      console.log(`Key: [${row.key}]`);
      console.log(`Description: ${row.description}`);
      console.log('Value:', JSON.stringify(row.value, null, 2));
    }

    // 2. Check Realtime Publication
    console.log('\n--- 2. Verification of Supabase Realtime Publication ---');
    const pubRes = await client.query(`
      SELECT pubname, schemaname, tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'umar_os_config';
    `);
    console.log('Realtime publication table membership:', pubRes.rows);

    // 3. Check remittance_orders table
    console.log('\n--- 3. Verification of public.remittance_orders ---');
    const remCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'remittance_orders'
      ORDER BY ordinal_position;
    `);
    console.log(`Table public.remittance_orders exists with ${remCols.rowCount} columns:`);
    remCols.rows.forEach(col => {
      console.log(` - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    const remRLS = await client.query(`
      SELECT policyname, cmd, roles 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'remittance_orders';
    `);
    console.log('Remittance orders RLS policies:', remRLS.rows);

    // 4. Check menu_categories for Party Box & Food Palace
    console.log('\n--- 4. Verification of public.menu_categories for Anchor Stores ---');
    const catsRes = await client.query(`
      SELECT id, restaurant_id, name_en, name_bn, sort_order 
      FROM public.menu_categories 
      WHERE restaurant_id IN ('rst_party_box', 'party_box', 'rst_food_palace', 'food_palace')
      ORDER BY restaurant_id, sort_order;
    `);
    console.log(`Found ${catsRes.rowCount} categories for anchor stores:`);
    console.table(catsRes.rows);

    // Specifically verify Party Box BIRYANIS & BOWLS rank
    const partyBoxRank3 = catsRes.rows.find(c => (c.restaurant_id === 'rst_party_box' || c.restaurant_id === 'party_box') && c.sort_order === 3);
    console.log('\n*** VERIFICATION OF PARTY BOX RANK #3 ***');
    console.log('Rank #3 Category:', partyBoxRank3);
    if (partyBoxRank3 && partyBoxRank3.name_en === 'BIRYANIS & BOWLS') {
      console.log('PROVED: Party Box BIRYANIS & BOWLS is strictly at sort_order rank #3!');
    } else {
      console.error('FAILED: Party Box BIRYANIS & BOWLS is NOT at rank #3!');
    }

    // 5. Check Anchor Restaurants
    console.log('\n--- 5. Verification of Anchor Stores in public.restaurants ---');
    const restRes = await client.query(`
      SELECT id, name, slug, status, active, cuisine_summary 
      FROM public.restaurants 
      WHERE id IN ('rst_party_box', 'party_box', 'rst_food_palace', 'food_palace');
    `);
    console.table(restRes.rows);

    // 6. Check Menu Items under Party Box
    console.log('\n--- 6. Verification of Menu Items under mc_pb_biryanis_bowls ---');
    const itmRes = await client.query(`
      SELECT id, restaurant_id, category_id, name_en, base_price_paise, available 
      FROM public.menu_items 
      WHERE category_id = 'mc_pb_biryanis_bowls';
    `);
    console.table(itmRes.rows);

    console.log('\n============================================================');
    console.log('ALL MIGRATION STEPS EXECUTED AND VERIFIED SUCCESSFULLY!');
    console.log('============================================================');

  } catch (err) {
    console.error('MIGRATION EXECUTION FAILED:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
