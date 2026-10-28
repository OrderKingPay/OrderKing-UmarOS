import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    console.log("Connected to database...");
    const versionRes = await pool.query("SELECT version()");
    console.log("PostgreSQL Version:", versionRes.rows[0].version);

    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('orders', 'sovereign_tickets', 'kingpay_wallets', 'financial_ledger', 'tickets', 'support_tickets')
      ORDER BY table_name;
    `);
    console.log("Matching Target Tables:", tablesRes.rows.map(r => r.table_name));

    for (const t of ['orders', 'sovereign_tickets', 'kingpay_wallets', 'financial_ledger', 'tickets', 'support_tickets']) {
      const exists = await pool.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
        [t]
      );
      if (exists.rows.length === 0) {
        console.log(`\nTable '${t}': [NOT FOUND]`);
      } else {
        const cols = await pool.query(
          "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
          [t]
        );
        console.log(`\nTable '${t}': [EXISTS] with ${cols.rows.length} columns:`);
        console.log("  Columns:", cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

        const indexes = await pool.query(
          "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1",
          [t]
        );
        console.log(`  Indexes (${indexes.rows.length}):`);
        indexes.rows.forEach(i => console.log(`    - ${i.indexname}: ${i.indexdef}`));
      }
    }
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await pool.end();
  }
}

run();
