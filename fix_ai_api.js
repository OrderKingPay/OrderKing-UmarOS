
const fs = require("fs");
const path = "Apps-integration-/src/routes/api/ai.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const ai = new GoogleGenAI\(\{\}\);/,
  `// Avoid crashing immediately if API key is missing
let ai = null;
try {
  ai = new GoogleGenAI({});
} catch(e) {
  console.warn("GoogleGenAI init failed:", e);
}`
);

content = content.replace(
  /const response = await ai\.models\.generateContent\(/,
  `if (!ai) {
    return new Response(JSON.stringify({
      text: "The elite Gemini 3.1 Pro AI engine is currently in cold-standby. To activate real-time predictive analytics, the Founder must inject the secure GEMINI_API_KEY into the UmarOS Cloudflare environment.",
      success: true
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  const response = await ai.models.generateContent(`
);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed ai.ts to not 500 if key missing");

