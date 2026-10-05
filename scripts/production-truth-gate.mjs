import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const apps = [
  ["HDmaster", "orderking-hdmaster"],
  ["orderking-customers", "orderking-customers"],
  ["orderking-partners", "orderking-partners"],
  ["orderking-riders", "orderking-riders"],
  ["Apps-integration-", "apps-integration"],
];

const failures = [];

const read = (p) => fs.readFileSync(path.join(repoRoot, p), "utf8");
const exists = (p) => fs.existsSync(path.join(repoRoot, p));

for (const [dir, expectedName] of apps) {
  const wrangler = path.join(dir, "wrangler.toml");
  if (!exists(wrangler)) failures.push(`${wrangler}: missing Cloudflare Pages config`);
  else {
    const c = read(wrangler);
    if (!c.includes(`name = "${expectedName}"`)) {
      failures.push(`${wrangler}: project name does not match expected ${expectedName}`);
    }
    if (!c.includes('pages_build_output_dir = "./dist"')) {
      failures.push(`${wrangler}: missing dist output`);
    }
    if (!c.includes('ORDERKING_RUNTIME = "production"')) {
      failures.push(`${wrangler}: production runtime marker missing`);
    }
  }

  const vitePath = path.join(dir, "vite.config.ts");
  if (exists(vitePath)) {
    const c = read(vitePath);
    if (/preset:\s*"vercel"|preset:\s*process\.env\.NETLIFY|preset:\s*process\.env\.CF_PAGES/.test(c)) {
      failures.push(`${vitePath}: non-Cloudflare deployment preset remains`);
    }
  }
}

const forbiddenCredentialPatterns = [
  /RAZORPAY_KEY_ID\s*\|\|\s*["']test_key["']/,
  /RAZORPAY_KEY_SECRET\s*\|\|\s*["']test_secret["']/,
];
const candidates = [
  "orderking-customers/src/lib/kingpay/wallet.ts",
  "orderking-partners/src/lib/kingpay/settlement.ts",
];
for (const p of candidates) {
  if (!exists(p)) continue;
  const c = read(p);
  for (const re of forbiddenCredentialPatterns) {
    if (re.test(c)) failures.push(`${p}: test credential fallback remains`);
  }
}

const dbFiles = apps.map(([dir]) => `${dir}/src/lib/db.ts`);
for (const p of dbFiles) {
  if (!exists(p)) continue;
  const c = read(p);
  if (!c.includes("ORDERKING_RUNTIME") || !c.includes("DATABASE_URL is required")) {
    failures.push(`${p}: production DB fail-closed guard missing`);
  }
}

const authFiles = apps.map(([dir]) => `${dir}/src/lib/auth/server.ts`);
for (const p of authFiles) {
  if (!exists(p)) continue;
  const c = read(p);
  if (/https:\/\/(?:[\w-]+\.)*(?:vercel\.app|netlify\.app)\b/.test(c)) {
    failures.push(`${p}: legacy Vercel/Netlify origin remains in active auth trust config`);
  }
  if (c.includes("process.env.VERCEL_URL") || c.includes("process.env.VERCEL_PROJECT_PRODUCTION_URL")) {
    failures.push(`${p}: Vercel runtime origin fallback remains active`);
  }
}

const legacyCronFiles = [
  "HDmaster/src/routes/api/dispatch/cron/run-auto-dispatch.ts",
  "HDmaster/src/routes/api/finance/cron/run-settlement.ts",
];
for (const p of legacyCronFiles) {
  if (!exists(p)) continue;
  const c = read(p);
  if (c.includes("x-vercel-cron") || c.includes("process.env.VERCEL")) {
    failures.push(`${p}: legacy Vercel cron authentication remains`);
  }
}

const crypto = "HDmaster/src/lib/orderking/finance/crypto-treasury.ts";
if (exists(crypto) && !read(crypto).includes("FUTURE/DISABLED")) {
  failures.push("crypto treasury: unverified production payment path is not explicitly gated");
}

const kingpay = "orderking-customers/src/routes/king-pay.tsx";
if (exists(kingpay)) {
  const c = read(kingpay);
  const forbiddenKingPaySimulation = [
    /useState\\(750\\)/,
    /balance:\\s*24850/,
    /balance:\\s*68120/,
    /randomBal/,
    /Offline Payment Cleared/,
    /verified via NPCI UPI/,
  ];
  for (const re of forbiddenKingPaySimulation) {
    if (re.test(c)) failures.push(kingpay + ": simulated KingPay state remains");
  }
  if (!c.includes("VITE_KINGPAY_WALLET_ENABLED") || !c.includes("VITE_KINGPAY_PUBLIC_UPI_ENABLED") || !c.includes("VITE_KINGPAY_BANK_LINKING_ENABLED")) {
    failures.push(kingpay + ": real-money KingPay feature gates are missing");
  }
}

const customerWrangler = "orderking-customers/wrangler.toml";
if (exists(customerWrangler) && !read(customerWrangler).includes('KINGPAY_WALLET_ENABLED = "false"')) {
  failures.push("orderking-customers/wrangler.toml: KingPay wallet is not explicitly disabled in production");
}

const workflow = read(".github/workflows/production-gate.yml");
if (!workflow.includes("version: 12.8.1")) failures.push("production-gate.yml: pnpm 12.8.1 not pinned");

if (failures.length) {
  console.error("PRODUCTION_TRUTH_GATE_FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PRODUCTION_TRUTH_GATE_PASSED");
console.log(`Validated ${apps.length} Cloudflare app surfaces and fail-closed production controls.`);
