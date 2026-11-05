const path = require('path');
const pg = require(path.join(__dirname, '../node_modules/.pnpm/pg@8.23.0/node_modules/pg'));

const connStr = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=no-verify";

async function main() {
  const client = new pg.Client({ connectionString: connStr });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurant_outlets'");
  console.log('restaurant_outlets columns:', res.rows);
  const res2 = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurants'");
  console.log('restaurants columns:', res2.rows.map(r => r.column_name));
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
