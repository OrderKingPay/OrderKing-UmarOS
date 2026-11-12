import https from "node:https";
import pg from "../node_modules/.pnpm/pg@8.23.0/node_modules/pg/lib/index.js";

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";
const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
if (!FAST2SMS_API_KEY || !DATABASE_URL) {
  console.error("Set FAST2SMS_API_KEY and DATABASE_URL. Nothing was checked.");
  process.exit(1);
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verifyFast2SMS() {
  process.stdout.write("1. Verifying Fast2SMS Wallet Balance... ");
  try {
    const res = await fetchJson("https://www.fast2sms.com/dev/wallet", {
      method: "POST",
      headers: {
        authorization: FAST2SMS_API_KEY,
      },
    });
    if (res.status === 200 && res.data?.return === true) {
      console.log(`✅ ACTIVE (Wallet: ₹${res.data.wallet})`);
      return true;
    } else {
      console.log(`❌ FAILED (Status: ${res.status}, ${JSON.stringify(res.data || res.raw)})`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ERROR (${err.message})`);
    return false;
  }
}

async function verify2Factor() {
  process.stdout.write("2. Verifying 2Factor.in Balance... ");
  try {
    const res = await fetchJson(`https://2factor.in/API/V1/${encodeURIComponent(TWOFACTOR_API_KEY)}/BAL/SMS`, {
      method: "GET",
    });
    if (res.status === 200 && res.data?.Status === "Success") {
      console.log(`✅ ACTIVE (${res.data.Details} credits)`);
      return true;
    } else {
      console.log(`❌ FAILED (Status: ${res.status}, ${JSON.stringify(res.data || res.raw)})`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ERROR (${err.message})`);
    return false;
  }
}

async function verifySupabaseDb() {
  process.stdout.write("3. Verifying Supabase PostgreSQL 17.6 (Port 5432)... ");
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    const client = await pool.connect();
    const t0 = Date.now();
    const res = await client.query(`
      SELECT 
        (SELECT count(*) FROM restaurants) as restaurants_count,
        (SELECT count(*) FROM orders) as orders_count,
        (SELECT count(*) FROM platform_settings) as settings_count,
        version() as pg_version
    `);
    const latency = Date.now() - t0;
    client.release();
    await pool.end();
    console.log(`✅ CONNECTED (${latency}ms)`);
    console.log(`   - PostgreSQL: ${res.rows[0].pg_version.split(" on ")[0]}`);
    console.log(`   - Restaurants: ${res.rows[0].restaurants_count}`);
    console.log(`   - Orders: ${res.rows[0].orders_count}`);
    console.log(`   - Platform Settings: ${res.rows[0].settings_count}`);
    return true;
  } catch (err) {
    console.log(`❌ DB ERROR (${err.message})`);
    await pool.end().catch(() => {});
    return false;
  }
}

async function main() {
  console.log("=== ORDERKING LIVE TELECOM & DATABASE VERIFICATION ===");
  const f2sOk = await verifyFast2SMS();
  const tfOk = await verify2Factor();
  const dbOk = await verifySupabaseDb();
  console.log("======================================================");
  if (f2sOk && tfOk && dbOk) {
    console.log("🎉 ALL LIVE CONNECTIONS VERIFIED 100% OPERATIONAL!");
    process.exit(0);
  } else {
    console.error("⚠️ ONE OR MORE VERIFICATIONS FAILED!");
    process.exit(1);
  }
}

main();
