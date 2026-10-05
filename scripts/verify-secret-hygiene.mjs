import fs from "node:fs";
import path from "node:path";

const roots = ["HDmaster/src","orderking-customers/src","orderking-partners/src","orderking-riders/src","Apps-integration-/src","scripts"];
const bannedTokens = ["ok_prod_sec_","postgresql://","postgres://","RAZORPAY_KEY_ID=\"","RAZORPAY_KEY_SECRET=\"","BETTER_AUTH_SECRET=\"","GROK_AUTH_CLIENT_SECRET=\"","OPENAI_API_KEY=\"","test_key","test_secret"];
const extensions = new Set([".ts",".tsx",".js",".mjs",".cjs",".json",".toml",".yaml",".yml"]);
const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) {
      const source = fs.readFileSync(full, "utf8");
      for (const token of bannedTokens) if (source.includes(token)) failures.push(full + ": " + token);
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
