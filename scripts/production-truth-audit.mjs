import { readdir } from "node:fs/promises";
import path from "node:path";

const roots = [
  "HDmaster/src",
  "orderking-partners/src",
  "orderking-riders/src",
  "Apps-integration-/src",
];

const forbidden = [
  { label: "hard-coded Razorpay test key", pattern: /test_key/gi },
  { label: "hard-coded Razorpay test secret", pattern: /test_secret/gi },
  { label: "fabricated mock UUID", pattern: /mock-uuid-for-now/gi },
  { label: "fabricated PostgreSQL health counts", pattern: /activeConnections\s*:\s*4/gi },
  { label: "fabricated Regional Merchant Gazette result", pattern: /Regional Merchant Gazette 2026/gi },
];

const ignored = new Set(["node_modules", "dist", ".git", ".grok"]);
const sourceExt = new Set([".ts", ".tsx", ".js", ".mjs"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (sourceExt.has(path.extname(entry.name)) && !/\.test\.[^.]+$/.test(entry.name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const root of roots) {
  for (const file of await walk(root)) {
    const text = await Bun.file(file).text().catch(async () => "");
    if (!text) continue;
    for (const rule of forbidden) {
      if (rule.pattern.test(text)) violations.push({ file, rule: rule.label });
    }
  }
}

if (violations.length) {
  console.error("Production truth audit FAILED:");
  for (const v of violations) console.error(`- ${v.rule}: ${v.file}`);
  process.exit(1);
}

console.log("Production truth audit passed: no blocked hard-coded provider/fake-health patterns found.");
