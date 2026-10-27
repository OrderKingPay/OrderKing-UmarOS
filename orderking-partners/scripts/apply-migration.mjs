import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'node:fs';
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
  const sql = fs.readFileSync(join(currentDir, '..', '..', 'supabase', 'migrations', '20261027_onboarding_fields.sql'), 'utf8');
  console.log('Applying migration 20261027_onboarding_fields.sql...');
  await client.query(sql);
  console.log('Migration applied successfully!');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
