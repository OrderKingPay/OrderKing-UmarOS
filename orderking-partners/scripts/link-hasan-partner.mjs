import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(currentDir, '..', '.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: join(currentDir, '..', '..', '.env') });
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  const users = [
    'oujIzx2ZJdXz9aqFbsQS2K7jjPWD02Gz', // hasan 9395065587@partner.orderking.in
    'hFDND5m1DVLqe8GcC5rfngo52wfxu6tW'  // Hasan Mohammed Habibullah
  ];
  for (const uid of users) {
    const existing = await client.query('select * from restaurant_staff where user_id = $1 and restaurant_id = $2', [uid, 'rst_e2e_mvqfakyg']);
    if (existing.rowCount === 0) {
      await client.query(`
        insert into restaurant_staff (id, restaurant_id, outlet_id, user_id, role, is_active, created_at)
        values ($1, $2, $3, $4, $5, $6, now())
      `, [
        `stf_${uid.slice(0, 8)}_e2e`,
        'rst_e2e_mvqfakyg',
        'out_e2e_mvqfakyg',
        uid,
        'OWNER',
        true
      ]);
      console.log(`Linked user ${uid} to rst_e2e_mvqfakyg as OWNER`);
    } else {
      console.log(`User ${uid} already linked to rst_e2e_mvqfakyg`);
    }
  }
  const staff = await client.query('select * from restaurant_staff');
  console.log('ACTIVE STAFF MEMBERSHIPS:', staff.rows);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
