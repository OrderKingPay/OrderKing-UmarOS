import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres' });
pool.query(`
create table if not exists partner_support_tickets (
  id text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  user_id text not null,
  topic text not null,
  message text not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);
create index if not exists partner_support_rest_idx on partner_support_tickets (restaurant_id);
`).then(() => { console.log('Created!'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
