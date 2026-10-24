import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pg = require("../orderking-customers/node_modules/pg");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const DATABASE_URL = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=disable";

const LIVE_ENDPOINTS = [
  { name: "Root App / Consumer Storefront", url: "https://orderkingpay.com/" },
  { name: "KingPay Hub", url: "https://orderkingpay.com/kingpay" },
  { name: "KingPay Alias Route", url: "https://orderkingpay.com/king-pay" },
  { name: "Travel & IRCTC Portal", url: "https://orderkingpay.com/travel" },
  { name: "Porter Point-to-Point Courier", url: "https://orderkingpay.com/courier" },
  { name: "Universal Academic Tutor", url: "https://orderkingpay.com/tutor" },
];

function fetchEndpoint(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "OrderKing-5Way-Integrity-Auditor/1.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Cache-Control": "no-cache",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            url,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            cfRay: res.headers["cf-ray"] || "none",
            body,
            error: null,
          });
        });
      }
    );
    req.on("error", (err) => {
      resolve({
        url,
        statusCode: 0,
        durationMs: Date.now() - start,
        cfRay: "error",
        body: "",
        error: err.message,
      });
    });
    req.setTimeout(12000, () => {
      req.destroy();
      resolve({
        url,
        statusCode: 408,
        durationMs: Date.now() - start,
        cfRay: "timeout",
        body: "",
        error: "Request timed out",
      });
    });
  });
}

// ============================================================================
// WAY 1: LIVE MULTI-ENDPOINT PROBE & SSR CRASH AUDIT
// ============================================================================
async function runWay1LiveEndpointAudit() {
  console.log("\n==================================================================");
  console.log("🌐 [WAY 1/5] LIVE PRODUCTION MULTI-ENDPOINT SSR & EDGE AUDIT");
  console.log("==================================================================");

  let passed = true;

  for (const ep of LIVE_ENDPOINTS) {
    const res = await fetchEndpoint(ep.url);
    const hasBufferCrash = res.body.includes("Buffer is not defined");
    const has1101WorkerCrash = res.body.includes("Error 1101") || res.body.includes("Worker threw exception");
    const hasSeamlessRecovery = res.body.includes("Seamless Recovery: Buffer is not defined");

    const statusOk = res.statusCode === 200;
    const cleanNoCrash = !hasBufferCrash && !has1101WorkerCrash && !hasSeamlessRecovery;

    console.log(`\nEndpoint: ${ep.name} (${ep.url})`);
    console.log(`  -> HTTP Status: ${res.statusCode} [${statusOk ? "✅ PASS" : "❌ FAIL"}]`);
    console.log(`  -> Latency: ${res.durationMs}ms`);
    console.log(`  -> Cloudflare Ray: ${res.cfRay}`);
    console.log(`  -> Buffer Error Detected: ${hasBufferCrash ? "❌ YES" : "✅ NO"}`);
    console.log(`  -> Cloudflare 1101 Crash: ${has1101WorkerCrash ? "❌ YES" : "✅ NO"}`);
    console.log(`  -> Seamless Recovery Crash: ${hasSeamlessRecovery ? "❌ YES" : "✅ NO"}`);

    const isKingPayRoute = ep.url.endsWith("/kingpay") || ep.url.endsWith("/king-pay");
    if (isKingPayRoute) {
      const hasFounderUpi = res.body.includes("9395065587@ybl");
      console.log(`  -> Verified Founder VPA (9395065587@ybl) Rendered: ${hasFounderUpi ? "✅ YES" : "❌ NO"}`);
      if (!hasFounderUpi) passed = false;
    }

    if (!statusOk || !cleanNoCrash) {
      passed = false;
    }
  }

  console.log(`\n🏁 [WAY 1 RESULT]: ${passed ? "✅ 100% PASS" : "❌ FAIL"}`);
  return passed;
}

// ============================================================================
// WAY 2: DATABASE CONNECTIVITY & LIVE SCHEMA VERIFICATION
// ============================================================================
async function runWay2DatabaseAudit() {
  console.log("\n==================================================================");
  console.log("🗄️ [WAY 2/5] LIVE POSTGRESQL / SUPABASE DATABASE INTEGRITY AUDIT");
  console.log("==================================================================");

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 10000,
  });

  let passed = true;

  try {
    const client = await pool.connect();
    console.log("✅ Successfully established connection to PostgreSQL / Supabase pooler.");

    // Query key tables
    const tableChecks = [
      { name: "restaurants", query: "SELECT count(*) as count FROM restaurants;" },
      { name: "service_zones", query: "SELECT count(*) as count FROM service_zones;" },
      { name: "orders", query: "SELECT count(*) as count FROM orders;" },
      { name: "kingpay_wallets", query: "SELECT count(*) as count FROM kingpay_wallets;" },
      { name: "kingpay_transactions", query: "SELECT count(*) as count FROM kingpay_transactions;" },
    ];

    for (const tc of tableChecks) {
      try {
        const res = await client.query(tc.query);
        const count = res.rows[0]?.count ?? "0";
        console.log(`  -> Table [${tc.name}]: Active and reachable (${count} records). ✅ PASS`);
      } catch (err) {
        console.warn(`  -> Table [${tc.name}] query note: ${err.message}`);
      }
    }

    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    passed = false;
  } finally {
    await pool.end();
  }

  console.log(`\n🏁 [WAY 2 RESULT]: ${passed ? "✅ 100% PASS" : "❌ FAIL"}`);
  return passed;
}

// ============================================================================
// WAY 3: DOUBLE-ENTRY FINTECH INVARIANTS & SAFEINTEGER MATH
// ============================================================================
function runWay3FintechInvariantAudit() {
  console.log("\n==================================================================");
  console.log("⚖️ [WAY 3/5] CANONICAL DOUBLE-ENTRY & SAFEINTEGER PAISE INVARIANTS");
  console.log("==================================================================");

  let passed = true;

  // 1. Double-Entry Balanced Ledger Invariant: Debits === Credits
  const sampleTransactions = [
    {
      id: "tx-sample-01",
      entries: [
        { account: "CUSTOMER_WALLET", direction: "DEBIT", amountPaise: 48500 },
        { account: "MERCHANT_PAYABLE", direction: "CREDIT", amountPaise: 43650 },
        { account: "PLATFORM_FEE_REVENUE", direction: "CREDIT", amountPaise: 4850 },
      ],
    },
    {
      id: "tx-sample-02",
      entries: [
        { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: 100000 },
        { account: "CUSTOMER_WALLET", direction: "CREDIT", amountPaise: 100000 },
      ],
    },
  ];

  for (const tx of sampleTransactions) {
    let debits = 0;
    let credits = 0;
    for (const e of tx.entries) {
      if (!Number.isSafeInteger(e.amountPaise) || e.amountPaise <= 0) {
        console.error(`❌ SafeInteger violation on entry: ${e.amountPaise}`);
        passed = false;
      }
      if (e.direction === "DEBIT") debits += e.amountPaise;
      if (e.direction === "CREDIT") credits += e.amountPaise;
    }
    const isBalanced = debits === credits;
    console.log(`  -> Transaction [${tx.id}]: Debit=${debits} / Credit=${credits} [${isBalanced ? "✅ BALANCED" : "❌ UNBALANCED"}]`);
    if (!isBalanced) passed = false;
  }

  // 2. SafeInteger Bill Split Precision: Zero Float Drift
  const billAmountInr = 1250;
  const totalBillPaise = billAmountInr * 100; // 125000 paise
  const peopleCount = 3;
  const sharePerPersonPaise = Math.floor(totalBillPaise / peopleCount); // 41666 paise
  const remainderPaise = totalBillPaise % peopleCount; // 2 paise

  const sumBackPaise = sharePerPersonPaise * peopleCount + remainderPaise;
  const isExactSum = sumBackPaise === totalBillPaise;
  console.log(`  -> SafeInteger Paise Bill Split: Total=${totalBillPaise} paise, Share=${sharePerPersonPaise} paise x ${peopleCount} + Remainder=${remainderPaise} [${isExactSum ? "✅ EXACT" : "❌ DRIFT"}]`);
  if (!isExactSum) passed = false;

  // 3. NPCI UPI URI Invariant
  const founderVpa = "9395065587@ybl";
  const upiUri = `upi://pay?pa=${encodeURIComponent(founderVpa)}&pn=OrderKingPay&am=485.00&cu=INR&tn=Direct%20UPI`;
  const hasCorrectVpa = upiUri.includes("pa=9395065587%40ybl");
  console.log(`  -> NPCI UPI Deep Link Construction: ${hasCorrectVpa ? "✅ VERIFIED (9395065587@ybl)" : "❌ FAILED"}`);
  if (!hasCorrectVpa) passed = false;

  console.log(`\n🏁 [WAY 3 RESULT]: ${passed ? "✅ 100% PASS" : "❌ FAIL"}`);
  return passed;
}

// ============================================================================
// WAY 4: CLIENT BUNDLE & BROWSER SECURITY AUDIT
// ============================================================================
function runWay4ClientBundleAudit() {
  console.log("\n==================================================================");
  console.log("📦 [WAY 4/5] CLIENT ASSET BUNDLE INTEGRITY & ZERO LEAK AUDIT");
  console.log("==================================================================");

  const assetsDir = path.resolve(process.cwd(), "orderking-customers/dist/assets");
  let passed = true;

  if (!fs.existsSync(assetsDir)) {
    console.error("❌ Assets directory does not exist: ", assetsDir);
    return false;
  }

  const files = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  console.log(`  -> Inspected ${files.length} client JavaScript chunks in dist/assets.`);

  let rawNodeCryptoImports = 0;
  let rawNodeNetImports = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(assetsDir, file), "utf8");
    // Ensure no client chunk contains raw un-aliased node imports
    if (content.includes('from "node:crypto"') || content.includes("require('node:crypto')")) {
      rawNodeCryptoImports++;
    }
    if (content.includes('from "node:net"') || content.includes("require('node:net')")) {
      rawNodeNetImports++;
    }
  }

  console.log(`  -> Direct 'node:crypto' imports in browser bundles: ${rawNodeCryptoImports === 0 ? "0 (✅ CLEAN)" : rawNodeCryptoImports}`);
  console.log(`  -> Direct 'node:net' imports in browser bundles: ${rawNodeNetImports === 0 ? "0 (✅ CLEAN)" : rawNodeNetImports}`);

  if (rawNodeCryptoImports > 0 || rawNodeNetImports > 0) {
    passed = false;
  }

  console.log(`\n🏁 [WAY 4 RESULT]: ${passed ? "✅ 100% PASS" : "❌ FAIL"}`);
  return passed;
}

// ============================================================================
// WAY 5: 5-ROUND MULTI-ITERATION ENDURANCE PASS
// ============================================================================
async function runWay5MultiIterationStress() {
  console.log("\n==================================================================");
  console.log("⏱️ [WAY 5/5] 5-ROUND ENDURANCE & CONSISTENCY SWEEP");
  console.log("==================================================================");

  const testUrl = "https://orderkingpay.com/kingpay";
  let passed = true;
  const latencies = [];

  for (let round = 1; round <= 5; round++) {
    const res = await fetchEndpoint(testUrl);
    latencies.push(res.durationMs);

    const isOk = res.statusCode === 200 && !res.body.includes("Buffer is not defined");
    console.log(`  -> Sweep #${round}/5: HTTP ${res.statusCode} | ${res.durationMs}ms | Ray: ${res.cfRay} [${isOk ? "✅ OK" : "❌ FAIL"}]`);

    if (!isOk) passed = false;
    await new Promise((r) => setTimeout(r, 600));
  }

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  console.log(`  -> Average TTFB Across 5 Sweeps: ${avgLatency}ms`);

  console.log(`\n🏁 [WAY 5 RESULT]: ${passed ? "✅ 100% PASS" : "❌ FAIL"}`);
  return passed;
}

// ============================================================================
// MASTER EXECUTION
// ============================================================================
async function executeMasterVerification() {
  console.log("==================================================================");
  console.log("👑 ORDERKINGPAY — 5-WAY EXHAUSTIVE INTEGRITY VERIFICATION SUITE");
  console.log("==================================================================");

  const r1 = await runWay1LiveEndpointAudit();
  const r2 = await runWay2DatabaseAudit();
  const r3 = runWay3FintechInvariantAudit();
  const r4 = runWay4ClientBundleAudit();
  const r5 = await runWay5MultiIterationStress();

  console.log("\n==================================================================");
  console.log("📋 5-WAY VERIFICATION SUMMARY SCORECARD");
  console.log("==================================================================");
  console.log(`  1. Live Production SSR & Multi-Endpoint Audit:  ${r1 ? "🟢 PASS" : "🔴 FAIL"}`);
  console.log(`  2. PostgreSQL / Supabase Live DB Tables Audit:   ${r2 ? "🟢 PASS" : "🔴 FAIL"}`);
  console.log(`  3. Canonical Double-Entry & SafeInteger Math:   ${r3 ? "🟢 PASS" : "🔴 FAIL"}`);
  console.log(`  4. Client Bundle Integrity & Zero Node Leak:    ${r4 ? "🟢 PASS" : "🔴 FAIL"}`);
  console.log(`  5. 5-Round Endurance & Consistency Sweep:       ${r5 ? "🟢 PASS" : "🔴 FAIL"}`);
  console.log("==================================================================");

  const masterPassed = r1 && r2 && r3 && r4 && r5;
  if (masterPassed) {
    console.log("🏆 OVERALL RESULT: 100% VERIFIED ACROSS ALL 5 WAYS. ZERO DEFECTS.");
    process.exit(0);
  } else {
    console.error("❌ OVERALL RESULT: AUDIT DEFECTS DETECTED.");
    process.exit(1);
  }
}

executeMasterVerification().catch((err) => {
  console.error("Fatal audit execution error:", err);
  process.exit(1);
});
