import { getSql } from './HDmaster/src/lib/db.ts';

async function upgradeSchema() {
  const sql = await getSql();
  console.log('Upgrading schema for Starlink AI Dispatch...');
  
  await sql.unsafe(\
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lat FLOAT;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lng FLOAT;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS lat FLOAT;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS lng FLOAT;
    
    -- Add indexes for spatial queries (B-Tree on coordinates is better than nothing, PostGIS not assumed)
    CREATE INDEX IF NOT EXISTS rst_lat_idx ON restaurants (lat);
    CREATE INDEX IF NOT EXISTS rst_lng_idx ON restaurants (lng);
  \);
  
  console.log('Schema upgraded successfully.');
  process.exit(0);
}
upgradeSchema().catch(console.error);
