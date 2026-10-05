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

const workflow = read(".github/workflows/production-gate.yml");
if (!workflow.includes("version: 12.8.1")) failures.push("production-gate.yml: pnpm 12.8.1 not pinned");

if (failures.length) {
  console.error("PRODUCTION_TRUTH_GATE_FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PRODUCTION_TRUTH_GATE_PASSED");
console.log(`Validated ${apps.length} Cloudflare app surfaces and fail-closed production controls.`);
