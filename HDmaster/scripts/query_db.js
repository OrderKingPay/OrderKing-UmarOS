import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres' });
client.connect().then(() => client.query('SELECT id, name, email, role_key, assumed_role_key FROM employees')).then(res => { console.log(res.rows); client.end(); }).catch(console.error);
