import { readFileSync } from "node:fs";
import { join } from "node:path";

const apps = [
  ["HDmaster", "orderking-umar-os"],
  ["orderking-customers", "orderking-customers"],
  ["orderking-partners", "orderking-partners"],
  ["orderking-riders", "orderking-riders"],
  ["Apps-integration-", "orderking-integrations"],
];

const failures = [];

for (const [dir, project] of apps) {
  const vitePath = join(dir, "vite.config.ts");
  const wranglerPath = join(dir, "wrangler.toml");
  const vite = readFileSync(vitePath, "utf8");
  const wrangler = readFileSync(wranglerPath, "utf8");

  if (!vite.includes('preset: "cloudflare-pages"')) {
    failures.push(`${dir}: Nitro preset is not cloudflare-pages`);
  }
  if (!wrangler.includes(`name = "${project}"`)) {
    failures.push(`${dir}: Wrangler project name mismatch`);
  }
  if (!wrangler.includes('pages_build_output_dir = "dist"')) {
    failures.push(`${dir}: pages_build_output_dir must be dist`);
  }
  if (!wrangler.includes("nodejs_compat")) {
    failures.push(`${dir}: nodejs_compat flag is required`);
  }
}

if (failures.length) {
  console.error("CLOUDFLARE MATRIX FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("CLOUDFLARE MATRIX OK: 5/5 application surfaces target Cloudflare Pages.");
