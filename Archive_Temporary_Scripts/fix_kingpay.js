
const fs = require("fs");
const path = "orderking-customers/src/routes/king-pay.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /\} : activeSection === "account" \? \([\s\S]*?<KingPayAccountHub[\s\S]*?onOpenScanner=\{[\s\S]*?\}[\s\S]*?\/>/,
  `} : activeSection === "account" ? (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-900 text-sm flex items-center gap-3">
              <span className="text-2xl">🚧</span>
              <p>Banking and UPI services are temporarily suspended pending regulatory approval. Please use Travel & Utility booking services.</p>
            </div>`
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");

