import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres' });
pool.query(`
alter table restaurants add column if not exists udyam_number text not null default '';
alter table restaurants add column if not exists dpiit_number text not null default '';
`).then(() => { console.log('Created!'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
