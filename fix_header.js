
const fs = require("fs");
const path = "orderking-customers/src/components/market/shell.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /<button\s+type="button"\s+onClick=\{toggleTheme\}\s+className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-fg"\s+aria-label="Toggle Theme"\s+>\s+\{theme === "light" \? <Moon className="h-4 w-4" \/> : <Sun className="h-4 w-4" \/>\}\s+<\/button>/,
  ""
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");

