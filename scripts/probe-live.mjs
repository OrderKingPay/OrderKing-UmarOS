import https from "node:https";

const urls = [
  "https://orderkingpay.com/",
  "https://www.orderkingpay.com/",
  "https://orderking-customers.pages.dev/",
  "https://orderkingpay.com/travel",
  "https://orderkingpay.com/kingpay"
];

async function probe(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OrderKing-Deployment-Auditor/1.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => { if (data.length < 5000) data += chunk; });
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
          bodyPreview: data.slice(0, 200).replace(/\s+/g, " ")
        });
      });
    });
    req.on("error", (e) => resolve({ url, error: e.message, durationMs: Date.now() - start }));
    req.setTimeout(12000, () => {
      req.destroy();
      resolve({ url, error: "timeout", durationMs: Date.now() - start });
    });
  });
}

async function main() {
  console.log("=== COMPREHENSIVE LIVE PROBE AUDIT ===\n");
  const results = [];
  for (const u of urls) {
    const res = await probe(u);
    results.push(res);
    console.log(`URL: ${res.url}`);
    console.log(`Status: ${res.statusCode} (${res.durationMs}ms)`);
    console.log(`CF-Ray: ${res.headers?.["cf-ray"]}`);
    console.log(`Cache-Control: ${res.headers?.["cache-control"]}`);
    console.log(`Content-Type: ${res.headers?.["content-type"]}`);
    console.log(`Body: ${res.bodyPreview?.slice(0, 100)}...`);
    console.log("--------------------------------------------------");
  }

  const allPass = results.every(r => r.statusCode === 200);
  console.log(`\nALL 5 REQUIRED ENDPOINTS VERIFIED: ${allPass ? "SUCCESS (100% 200 OK)" : "FAIL"}`);
}

main().catch(console.error);
