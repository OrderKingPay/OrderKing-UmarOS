
const fs = require("fs");
const path = "orderking-customers/src/components/fintech/kingpay-shell.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /activeSection === "account"\s*\?\s*"bg-emerald-100 text-emerald-800 dark:bg-emerald-900\/40 dark:text-emerald-100 font-bold border border-emerald-300 dark:border-emerald-700 shadow-sm"\s*:\s*"bg-surface-2 text-muted hover:bg-surface-3"/,
  `activeSection === "account" ? "hidden" : "hidden"`
);

content = content.replace(
  /<button\s*type="button"\s*onClick=\{\(\) => onSelectSection\("account"\)\}\s*className=\{cn\(\s*"flex min-w-max items-center gap-1\.5 rounded-full px-3 py-1\.5 text-sm transition-all",\s*activeSection === "account"\s*\?\s*"hidden"\s*:\s*"hidden"\s*\)\}\s*>\s*<span className="text-base">🏦<\/span>\s*<span>UPI & Banking<\/span>\s*<\/button>/g,
  ""
);


fs.writeFileSync(path, content, "utf8");
console.log("Done");

