import { getSql } from './orderking-customers/src/lib/db.ts';

async function main() {
  try {
    const sql = await getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id INT PRIMARY KEY DEFAULT 1,
        settings_json TEXT NOT NULL DEFAULT '{}'
      )
    `;
    console.log("Table verified");
    const rows = await sql`SELECT * FROM platform_settings`;
    console.log("Rows:", rows);
  } catch (e) {
    console.error(e);
  }
}
main();
