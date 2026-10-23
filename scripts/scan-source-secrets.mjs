// Lightweight tracked-source secret regression gate.
// This is pattern screening, never a guarantee that all secrets are absent.
import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [
  ["provider-hosted PostgreSQL password", /postgres(?:ql)?:\/\/[^\s"'\x60<>@/]+:[^\s"'\x60<>@/]+@[^\s"'\x60<>/]*(?:supabase\.co|neon\.tech)/i],
  ["live-format Razorpay ID", /rzp_live_[A-Za-z0-9]{13,}/],
  ["live-format Stripe secret", /sk_live_[A-Za-z0-9]{24,}/],
  ["OpenAI project key", /sk-proj-[A-Za-z0-9_-]{25,}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{30,}/],
  ["GitHub token", /ghp_[A-Za-z0-9]{30,}/],
];

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean);
let scanned = 0;
const findings = [];
for (const file of files) {
  let bytes;
  try {
    if (statSync(file).size > 2_000_000) continue;
    bytes = readFileSync(file);
  } catch { continue; }
  if (bytes.subarray(0, 512).includes(0)) continue;
  scanned++;
  const text = bytes.toString("utf8");
  for (const [type, regex] of checks) {
    if (regex.test(text)) findings.push({ file, type });
  }
}
console.log(`Screened ${scanned} tracked text files for high-confidence embedded credential patterns.`);
if (findings.length) {
  // Report locations and classes ONLY; never print matched values.
  for (const f of findings) console.error(`Sensitive pattern: ${f.type} in ${f.file}`);
  process.exitCode = 1;
} else {
  console.log("No matching high-confidence patterns detected. Separate audits and rotation still required.");
}
