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
  const riderSample = await client.query(`SELECT * FROM riders LIMIT 1`);
  console.log('Sample rider row:', riderSample.rows[0]);
  const restaurantSample = await client.query(`SELECT * FROM restaurants LIMIT 1`);
  console.log('Sample restaurant row:', restaurantSample.rows[0]);
  await client.end();
}

main().catch(console.error);
