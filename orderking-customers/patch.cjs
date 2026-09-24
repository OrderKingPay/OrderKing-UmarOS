
const fs = require("fs");
let lines = fs.readFileSync("src/lib/server/ai-chat-service.server.ts", "utf8").split("\n");
let start = lines.findIndex(l => l.includes("// 5. No external provider available"));
let end = lines.findIndex((l, i) => i > start && l.includes("return {"));
if (start !== -1 && end !== -1) {
  let replacement = `  // 5. No external provider available — fallback to free Pollinations API
  let fallbackText = "I am currently operating offline. Please check your network connection.";
  try {
    const pRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: "You are HDmaster AI, the number one AI on earth, designed by OrderKing elite engineers to replace ChatGPT Plus, Grok, and Gemini. You are extremely realistic, powerful, and natural." },
          ...request.messages.map(m => ({ role: m.role, content: m.content }))
        ]
      })
    });
    const pData = await pRes.json();
    fallbackText = pData?.choices?.[0]?.message?.content || fallbackText;
  } catch (e) {
    console.error("Pollinations fallback failed:", e);
  }
  onStreamEvent?.({ type: "delta", data: fallbackText });
  onStreamEvent?.({ type: "done", data: { text: fallbackText, executionSteps: [], modelUsed: "hdmaster-omni" } });

  localRes = { text: fallbackText };
`;
  lines.splice(start, end - start, replacement);
  fs.writeFileSync("src/lib/server/ai-chat-service.server.ts", lines.join("\n"));
  console.log("Successfully patched");
}
