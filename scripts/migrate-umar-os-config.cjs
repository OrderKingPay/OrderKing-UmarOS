const { Client } = require('../node_modules/.pnpm/pg@8.23.0/node_modules/pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is required.");
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.umar_os_config (
        key text PRIMARY KEY,
        value jsonb NOT NULL DEFAULT '{}'::jsonb,
        updated_at timestamptz DEFAULT now(),
        updated_by text DEFAULT 'founder'
      );
    `);
    console.log('Table public.umar_os_config ensured.');

    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.umar_os_config;`);
      console.log('Added public.umar_os_config to supabase_realtime publication.');
    } catch (pubErr) {
      console.log('Publication notice (might already be added):', pubErr.message);
    }

    await client.query(`
      INSERT INTO public.umar_os_config (key, value)
      VALUES 
        ('founder_fees', '{"travel_pnr_convenience_fee_inr": 29, "wallet_cashback_reward_inr": 5, "food_platform_fee": 12, "remit_fee": 1.5}'::jsonb),
        ('economics', '{"food_platform_fee": 12, "remit_fee": 1.5, "platform_fee_paise": 1200}'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Default rows seeded.');

    const rows = await client.query('SELECT * FROM public.umar_os_config;');
    console.log('Current rows:', rows.rows);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();
