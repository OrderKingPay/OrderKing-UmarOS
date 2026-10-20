import { spawnSync } from "node:child_process";

console.log("=== INITIATING CLOUDFLARE PAGES WRANGLER DEPLOYMENT ===");
let deployed = false;

for (let i = 1; i <= 4; i++) {
  console.log(`\n[Deploy Attempt ${i}/4]...`);
  const res = spawnSync(
    "npx",
    ["wrangler", "pages", "deploy", "orderking-customers/dist", "--project-name=orderking-customers", "--branch=main", "--commit-dirty=true", "--no-bundle"],
    {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, CLOUDFLARE_API_TIMEOUT: "60000" }
    }
  );

  if (res.status === 0) {
    console.log("\n[SUCCESS] Cloudflare Pages deploy succeeded cleanly!");
    deployed = true;
    break;
  }
  console.log(`[Attempt ${i} exited with code ${res.status}. Retrying in 4s...]`);
  spawnSync("node", ["-e", "setTimeout(() => {}, 4000)"], { shell: true });
}

if (!deployed) {
  console.error("All deployment attempts failed.");
  process.exit(1);
}
