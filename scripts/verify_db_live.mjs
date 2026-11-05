import { getSql } from '../HDmaster/src/lib/db.ts';

async function check() {
  try {
    const sql = await getSql();
    const rows = await sql`SELECT current_database() as db, current_user as usr, version() as ver`;
    console.log('PostgreSQL Connection Verified:', rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('PostgreSQL Connection Error:', err.message);
    process.exit(1);
  }
}

check();
