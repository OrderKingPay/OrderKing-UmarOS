import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const tables = ['restaurants', 'restaurant_documents', 'riders', 'rider_kyc', 'rider_documents', 'restaurant_outlets', 'outlets'];
    for (const tbl of tables) {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tbl]);
      console.log(`\n=== Table: ${tbl} (${res.rows.length} columns) ===`);
      if (res.rows.length === 0) {
        console.log("  [TABLE DOES NOT EXIST]");
      } else {
        res.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
