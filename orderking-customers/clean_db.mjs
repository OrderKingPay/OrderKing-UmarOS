import pg from 'pg';

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Please set it in your environment variables.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    await client.query(`
      DELETE FROM promotions WHERE restaurant_id IN (SELECT id FROM restaurants WHERE data_label = 'SIMULATED');
      DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE data_label = 'SIMULATED'));
      DELETE FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE data_label = 'SIMULATED');
      DELETE FROM menu_items WHERE restaurant_id IN (SELECT id FROM restaurants WHERE data_label = 'SIMULATED');
      DELETE FROM restaurant_outlets WHERE restaurant_id IN (SELECT id FROM restaurants WHERE data_label = 'SIMULATED');
      DELETE FROM restaurants WHERE data_label = 'SIMULATED';
    `);
    console.log(`Deleted simulated restaurants and related data.`);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
