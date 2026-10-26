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
  const res = await client.query(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND is_nullable = 'NO' AND column_default IS NULL
  `);
  console.log('NOT NULL columns without default on `orders`:');
  console.table(res.rows);

  const sampleOrderFull = await client.query(`SELECT * FROM orders LIMIT 1`);
  console.log('Sample full order row keys and values:');
  console.log(sampleOrderFull.rows[0]);

  const eventCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'order_events'
  `);
  console.log('Columns on `order_events`:');
  console.table(eventCols.rows);

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%order%'
  `);
  console.log('Order-related tables:');
  console.table(tables.rows);

  const orderItemsCols = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'order_items'
  `);
  if (orderItemsCols.rows.length > 0) {
    console.log('Columns on `order_items`:');
    console.table(orderItemsCols.rows);
  }

  await client.end();
}

main().catch(console.error);
