import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = [
  ".github/workflows/production-gate.yml",
  "HDmaster/vite.config.ts",
  "Apps-integration-/vite.config.ts",
  "orderking-customers/src/lib/kingpay/wallet.ts",
  "orderking-partners/src/lib/kingpay/settlement.ts",
];

const forbidden = [
  { pattern: /\|\|\s*["']test_key["']/, label: "Razorpay test_key fallback" },
  { pattern: /\|\|\s*["']test_secret["']/, label: "Razorpay test_secret fallback" },
  { pattern: /preset\s*:\s*["'](?:vercel|netlify)["']/, label: "non-Cloudflare Nitro production preset" },
  { pattern: /process\.env\.NETLIFY\s*\?/, label: "Netlify production preset selection" },
];

const failures = [];

for (const rel of files) {
  const path = join(root, rel);
  let source = "";
  try {
    source = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  for (const rule of forbidden) {
    if (rule.pattern.test(source)) {
      failures.push(`${rel}: ${rule.label}`);
    }
  }
}

if (failures.length) {
  console.error("Production invariants FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production invariants PASS: no checked test-key fallbacks or Vercel/Netlify production preset selectors.");
