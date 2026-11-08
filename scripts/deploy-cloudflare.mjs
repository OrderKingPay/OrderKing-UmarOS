import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

console.log("=== INITIATING CLOUDFLARE PAGES WRANGLER DEPLOYMENT ===");

const nodeExe = existsSync("C:\\Program Files\\nodejs\\node.exe")
  ? "C:\\Program Files\\nodejs\\node.exe"
  : process.execPath;

const wranglerJs = resolve(process.cwd(), "node_modules/wrangler/bin/wrangler.js");

let deployed = false;

for (let i = 1; i <= 4; i++) {
  console.log(`\n[Deploy Attempt ${i}/4]...`);
  const res = spawnSync(
    nodeExe,
    [wranglerJs, "pages", "deploy", "orderking-customers/dist", "--project-name=orderking-customers", "--branch=main", "--commit-dirty=true"],
    {
      stdio: "inherit",
      env: { ...process.env, CLOUDFLARE_API_TIMEOUT: "60000" }
    }
  );

  if (res.status === 0) {
    console.log("\n[SUCCESS] Cloudflare Pages deploy succeeded cleanly!");
    deployed = true;
    break;
  }
  console.log(`[Attempt ${i} exited with code ${res.status}. Retrying in 4s...]`);
  spawnSync(nodeExe, ["-e", "setTimeout(() => {}, 4000)"]);
}

if (!deployed) {
  console.error("All deployment attempts failed.");
  process.exit(1);
}
