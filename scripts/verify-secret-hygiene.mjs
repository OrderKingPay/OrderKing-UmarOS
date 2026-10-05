import fs from "node:fs";
import path from "node:path";

const roots = ["HDmaster/src","orderking-customers/src","orderking-partners/src","orderking-riders/src","Apps-integration-/src"];
const extensions = new Set([".ts",".tsx",".js",".mjs",".cjs"]);
const failures = [];
const secretPatterns = [
  /ok_prod_sec_[A-Za-z0-9]+/i,
  /sk-(?:proj-|live-|test-)[A-Za-z0-9_-]{20,}/i,
  /AIza[0-9A-Za-z_-]{30,}/i,
  /rzp_(?:live|test)_[A-Za-z0-9]{10,}/i,
];

function shouldSkip(file) {
  return /(?:\.test|\.spec)\.[^.]+$/.test(file) || /(?:e2e-test|__tests__)\b/.test(file);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name)) && !shouldSkip(full)) {
      const source = fs.readFileSync(full, "utf8");
      for (const rule of secretPatterns) if (rule.test(source)) failures.push(full + ": " + rule);
    }
  }
}

for (const root of roots) walk(path.resolve(root));
if (failures.length) {
  console.error("Secret hygiene gate failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("Secret hygiene scan passed for active application source.");
