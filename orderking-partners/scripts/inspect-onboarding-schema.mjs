import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(currentDir, '..', '.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const tables = ['restaurants', 'restaurant_documents', 'riders', 'rider_kyc', 'rider_documents', 'restaurant_outlets', 'outlets'];
  
  for (const tbl of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tbl]);
    console.log(`\n=== Table: ${tbl} (${res.rows.length} columns) ===`);
    if (res.rows.length === 0) {
      console.log("  [DOES NOT EXIST]");
    } else {
      for (const r of res.rows) {
        console.log(`  ${r.column_name}: ${r.data_type} (null: ${r.is_nullable}, default: ${r.column_default})`);
      }
    }
  }

  await client.end();
}

main().catch(console.error);
