import fs from "node:fs";

const files = [
  "orderking-customers/src/lib/kingpay/wallet.ts",
  "orderking-partners/src/lib/kingpay/settlement.ts",
];

const banned = [
  /RAZORPAY_KEY_ID\s*\|\|\s*["']test_key["']/,
  /RAZORPAY_KEY_SECRET\s*\|\|\s*["']test_secret["']/,
];

const failures = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const rule of banned) {
    if (rule.test(source)) failures.push(file + ": " + rule);
  }
}

if (failures.length) {
  console.error("Payment-key safety gate failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("No fake Razorpay credential fallback is present in production payment modules.");
