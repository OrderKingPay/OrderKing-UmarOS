
const fs = require("fs");
const path = "orderking-customers/src/routes/tutor.tsx";
let content = fs.readFileSync(path, "utf8");

if (!content.includes("DailyHub")) {
  content = content.replace(
    /import \{ CustomerShell \} from "@\/components\/market\/shell";/,
    `import { CustomerShell } from "@/components/market/shell";\nimport { DailyHub } from "@/components/market/daily-hub";`
  );
  
  content = content.replace(
    /<div className="bg-white px-4 py-3 shadow-sm z-10 flex flex-col gap-3">/,
    `<div className="px-4 py-2 bg-gradient-to-br from-indigo-50 to-purple-50"><DailyHub /></div>\n          <div className="bg-white px-4 py-3 shadow-sm z-10 flex flex-col gap-3">`
  );
  
  fs.writeFileSync(path, content, "utf8");
  console.log("Added DailyHub to tutor");
}

