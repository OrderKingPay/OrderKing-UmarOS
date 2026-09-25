import https from 'https';

const PRODUCTION_URL = 'https://hdmaster.vercel.app/api/test-openai?token=UMAR_OS_ADMIN';

console.log("==================================================");
console.log("🚀 PHASE 1: UMAR OS SUPREME MASTER AI VERIFICATION");
console.log("==================================================");
console.log(`\nConnecting to production: ${PRODUCTION_URL}\n`);

https.get(PRODUCTION_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`[STATUS CODE]: ${res.statusCode}\n`);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (res.statusCode === 200 && json.status === "VERIFIED_REAL") {
        console.log("\n✅ PHASE 1 PASSED: Genuine OpenAI connection established.");
        console.log("✅ Tool executed successfully by the model.");
        console.log("✅ Vercel environment variables properly configured.");
        console.log("\nPlease provide this output as Production Evidence to proceed to Phase 2.");
      } else {
        console.log("\n❌ PHASE 1 FAILED. Please review the response above.");
      }
    } catch (e) {
      console.log("Raw Response:");
      console.log(data);
      console.log("\n❌ ERROR: Invalid JSON response.");
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
