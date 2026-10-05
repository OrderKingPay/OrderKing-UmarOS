import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apps = [
  ["HDmaster", "orderking-hdmaster"],
  ["orderking-customers", "orderking-customers"],
  ["orderking-partners", "orderking-partners"],
  ["orderking-riders", "orderking-riders"],
  ["Apps-integration-", "apps-integration"],
];

const failures = [];
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));

for (const [dir, expected] of apps) {
  const w = path.join(dir, "wrangler.toml");
  if (!exists(w)) {
    failures.push(w + ": missing");
    continue;
  }
  const c = read(w);
  if (!c.includes(`name = "${expected}"`)) failures.push(w + ": wrong Cloudflare project name");
  if (!c.includes('pages_build_output_dir = "dist"')) failures.push(w + ": dist output missing");
  if (!c.includes('ORDERKING_RUNTIME = "production"')) failures.push(w + ": production runtime marker missing");
  const v = path.join(dir, "vite.config.ts");
  if (exists(v) && /preset:\s*"vercel"|preset:\s*process\.env\.NETLIFY|preset:\s*process\.env\.CF_PAGES/.test(read(v))) {
    failures.push(v + ": legacy hosting preset remains");
  }
}

const authFiles = apps.map(([dir]) => path.join(dir, "src/lib/auth/server.ts"));
for (const p of authFiles) {
  if (!exists(p)) continue;
  const c = read(p);
  if (/vercel\.app|netlify\.app/.test(c)) failures.push(p + ": legacy hosting origin remains in auth trust");
  if (c.includes("process.env.VERCEL_URL") || c.includes("process.env.VERCEL_PROJECT_PRODUCTION_URL")) {
    failures.push(p + ": Vercel runtime fallback remains");
  }
}

const dbFiles = apps.map(([dir]) => path.join(dir, "src/lib/db.ts"));
for (const p of dbFiles) {
  if (!exists(p)) continue;
  const c = read(p);
  if (!c.includes("DATABASE_URL is required for production")) failures.push(p + ": production DB fail-closed guard missing");
}

const paymentFiles = [
  "orderking-partners/src/lib/kingpay/settlement.ts",
  "orderking-customers/src/lib/kingpay/wallet.ts",
];
for (const p of paymentFiles) {
  if (!exists(p)) continue;
  const c = read(p);
  if (/\|\|\s*["']test_(?:key|secret)["']/.test(c)) failures.push(p + ": test credential fallback remains");
}

const legacyCron = [
  "HDmaster/src/routes/api/dispatch/cron/run-auto-dispatch.ts",
  "HDmaster/src/routes/api/finance/cron/run-settlement.ts",
];
for (const p of legacyCron) {
  if (exists(p)) {
    const c = read(p);
    if (c.includes("x-vercel-cron") || c.includes("VERCEL")) failures.push(p + ": legacy Vercel cron logic remains");
  }
}

const crypto = "HDmaster/src/lib/orderking/finance/crypto-treasury.ts";
if (exists(crypto) && !read(crypto).includes("FUTURE/DISABLED")) {
  failures.push(crypto + ": crypto payment path is not explicitly disabled");
}

if (failures.length) {
  console.error("PRODUCTION_TRUTH_GATE_FAILED");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}
console.log("PRODUCTION_TRUTH_GATE_PASSED");
console.log("Validated " + apps.length + " Cloudflare surfaces plus auth/database/payment hardening.");
