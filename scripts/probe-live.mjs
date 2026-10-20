import https from "node:https";
import crypto from "node:crypto";

const urls = [
  "https://orderkingpay.com/",
  "https://www.orderkingpay.com/",
  "https://orderking-customers.pages.dev/",
  "https://orderkingpay.com/travel",
  "https://orderkingpay.com/kingpay"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function probe(url, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const res = await new Promise((resolve) => {
      const start = Date.now();
      const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OrderKing-Deployment-Auditor/1.0" } }, (res) => {
        let data = "";
        res.on("data", chunk => { if (data.length < 100000) data += chunk; });
        res.on("end", () => {
          resolve({
            url,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            headers: {
              "server": res.headers["server"],
              "cf-ray": res.headers["cf-ray"],
              "cf-cache-status": res.headers["cf-cache-status"],
              "cache-control": res.headers["cache-control"],
              "content-type": res.headers["content-type"],
            },
            data,
            bodyPreview: data.slice(0, 200).replace(/\s+/g, " ")
          });
        });
      });
      req.on("error", (e) => resolve({ url, error: e.message, durationMs: Date.now() - start }));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({ url, error: "timeout", durationMs: Date.now() - start });
      });
    });

    if (res.statusCode === 200 || attempt > retries) {
      return res;
    }
    console.log(`[Cold-start retry ${attempt}/${retries} for ${url} (got ${res.statusCode})]`);
    await sleep(1500);
  }
}

async function checkAssetBundle(mainHtml, baseUrl) {
  const match = mainHtml.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (!match) return null;
  const assetPath = match[1];
  const assetUrl = new URL(assetPath, baseUrl).toString();
  
  return new Promise((resolve) => {
    https.get(assetUrl, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        resolve({
          assetUrl,
          statusCode: res.statusCode,
          sizeBytes: buf.length,
          sha256: hash,
          cacheControl: res.headers["cache-control"]
        });
      });
    }).on("error", () => resolve(null));
  });
}

async function main() {
  console.log("=== COMPREHENSIVE LIVE PROBE AUDIT ===\n");
  const results = [];
  let rootHtml = "";

  for (const u of urls) {
    const res = await probe(u);
    results.push(res);
    if (u === "https://orderkingpay.com/") rootHtml = res.data || "";

    console.log(`URL: ${res.url}`);
    console.log(`Status: ${res.statusCode} (${res.durationMs}ms)`);
    console.log(`CF-Ray: ${res.headers?.["cf-ray"]}`);
    console.log(`Cache-Control: ${res.headers?.["cache-control"]}`);
    console.log(`Content-Type: ${res.headers?.["content-type"]}`);
    console.log(`Body: ${res.bodyPreview?.slice(0, 100)}...`);
    console.log("--------------------------------------------------");
    await sleep(800);
  }

  // Probe asset bundle integrity
  if (rootHtml) {
    const asset = await checkAssetBundle(rootHtml, "https://orderkingpay.com/");
    if (asset) {
      console.log("\n=== ASSET BUNDLE INTEGRITY ===");
      console.log(`Asset URL: ${asset.assetUrl}`);
      console.log(`Status: ${asset.statusCode}`);
      console.log(`Size: ${asset.sizeBytes} bytes`);
      console.log(`SHA-256: ${asset.sha256}`);
      console.log(`Cache-Control: ${asset.cacheControl}`);
      console.log("--------------------------------------------------");
    }
  }

  const allPass = results.every(r => r.statusCode === 200);
  console.log(`\nALL REQUIRED ENDPOINTS VERIFIED: ${allPass ? "SUCCESS (100% 200 OK)" : "FAIL"}`);
}

main().catch(console.error);
