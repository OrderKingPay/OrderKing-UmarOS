import { getSql } from './src/lib/db.ts';

async function run() {
  const sql = await getSql();
  const profiles = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`;
  console.log(profiles);
  process.exit(0);
}
run();
