import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(currentDir, '..', '.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  await client.connect();
  for (const t of ['menu_categories', 'menu_items', 'dishes']) {
    const res = await client.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1', [t]);
    console.log(t, res.rows.length, res.rows.map(r => r.column_name).join(', '));
  }
  await client.end();
}
run().catch(console.error);
