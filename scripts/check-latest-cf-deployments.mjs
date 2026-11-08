import fs from "node:fs";

const toml = fs.readFileSync("C:\\Users\\hasan\\.wrangler\\config\\default.toml", "utf8");
const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
const token = match[1];
const accountId = "fc53b6fd613df944a3a46606cfbf21d0";

async function check(proj) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${proj}/deployments?per_page=5`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  console.log(`\n=== ${proj} ===`);
  if (!data.result || !data.result.length) {
    console.log("No deployments found or error:", data.errors);
    return;
  }
  for (const d of data.result) {
    const commit = d.deployment_trigger?.metadata?.commit_hash?.slice(0, 7) || "unknown";
    const commitMsg = d.deployment_trigger?.metadata?.commit_message?.split("\n")[0]?.slice(0, 40) || "";
    const stage = d.latest_stage?.name;
    const stageStatus = d.latest_stage?.status;
    const isProduction = d.environment === "production";
    const aliases = d.aliases?.join(", ") || "none";
    console.log(`- Commit: ${commit} | Env: ${d.environment} | Latest Stage: ${stage} (${stageStatus}) | Aliases: ${aliases} | Msg: ${commitMsg}`);
    if (stageStatus === "failure") {
      const failedStage = d.stages.find(s => s.status === "failure");
      console.log(`  -> FAILED AT STAGE: ${failedStage?.name} (summary: ${JSON.stringify(failedStage?.summary || {})})`);
    }
  }
}

for (const p of ["orderking-hdmaster", "orderking-customers", "orderking-partners", "orderking-riders"]) {
  await check(p);
}
