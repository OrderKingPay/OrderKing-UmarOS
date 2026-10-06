import { getSql } from './HDmaster/src/lib/db.ts';

async function migrate() {
  const sql = await getSql();
  await sql`ALTER TABLE riders ADD COLUMN IF NOT EXISTS current_location JSONB;`;
  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch(console.error);
