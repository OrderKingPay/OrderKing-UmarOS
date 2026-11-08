import fs from "node:fs";

const toml = fs.readFileSync("C:\\Users\\hasan\\.wrangler\\config\\default.toml", "utf8");
const match = toml.match(/oauth_token\s*=\s*"([^"]+)"/);
const token = match[1];
const accountId = "fc53b6fd613df944a3a46606cfbf21d0";

async function inspect(proj) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${proj}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  console.log(`=== ${proj} ===`);
  console.log("build_config:", JSON.stringify(data.result?.build_config, null, 2));
}

for (const p of ["orderking-customers", "orderking-partners", "orderking-riders", "orderking-hdmaster"]) {
  await inspect(p);
}
