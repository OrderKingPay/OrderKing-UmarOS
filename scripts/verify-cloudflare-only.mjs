import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "orderking-customers/vite.config.ts",
  "orderking-partners/vite.config.ts",
  "orderking-riders/vite.config.ts",
  "HDmaster/vite.config.ts",
  "Apps-integration-/vite.config.ts",
  "orderking-customers/src/lib/auth/server.ts",
  "orderking-partners/src/lib/auth/server.ts",
  "orderking-riders/src/lib/auth/server.ts",
  "HDmaster/src/lib/auth/server.ts",
  "Apps-integration-/src/lib/auth/server.ts",
  "orderking-customers/src/lib/auth/client.ts",
  "orderking-partners/src/lib/auth/client.ts",
  "orderking-riders/src/lib/auth/client.ts",
  "HDmaster/src/lib/auth/client.ts",
  "Apps-integration-/src/lib/auth/client.ts",
  "HDmaster/src/routes/api/dispatch/cron/run-auto-dispatch.ts",
  "HDmaster/src/routes/api/finance/cron/run-settlement.ts",
  "HDmaster/src/lib/orderking/server/payment-http.server.ts",
  "HDmaster/src/lib/orderking/server/customer-order-http.server.ts",
  "orderking-customers/src/lib/server/orders.ts",
  "orderking-customers/src/lib/server/hdmaster-orders.ts",
  "orderking-customers/src/lib/server/hdmaster-order-read.ts",
  "orderking-partners/src/lib/server/hdmaster-order-transition.ts",
  "orderking-riders/src/lib/server/hdmaster-order-transition.ts",
  "orderking-customers/src/routes/login.tsx",
  "orderking-partners/src/routes/login.tsx",
  "orderking-riders/src/routes/login.tsx",
  "HDmaster/src/routes/login.tsx",
  "Apps-integration-/src/routes/login.tsx",
];

const banned = [
  /preset\s*:\s*["'](?:vercel|netlify)["']/i,
  /\.vercel\//i,
  /\bVERCEL_(?:URL|PROJECT_PRODUCTION_URL|ENV|CRON)\b/i,
  /\bNETLIFY_(?:URL|SITE_ID|AUTH_TOKEN)\b/i,
  /\bx-vercel-cron\b/i,
  /netlify\.app/i,
  /vercel\.app/i,
];

const failures = [];
for (const rel of files) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    failures.push({ file: rel, reason: "missing production config file" });
    continue;
  }
  const source = fs.readFileSync(full, "utf8");
  for (const rule of banned) {
    if (rule.test(source)) failures.push({ file: rel, reason: rule.toString() });
  }
}

if (failures.length) {
  console.error("Cloudflare-only production gate failed:");
  for (const failure of failures) console.error("- " + failure.file + ": " + failure.reason);
  process.exit(1);
}

console.log("Cloudflare-only production configuration verified for all five app surfaces.");
