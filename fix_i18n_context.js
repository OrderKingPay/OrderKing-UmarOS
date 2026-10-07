
const fs = require("fs");
const path = "orderking-riders/src/lib/rider/i18n-context.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /if \(v === "bn" \|\| v === "en" \|\| v === "as" \|\| v === "hi"\) return v;/,
  `if (["en","bn","hi","te","ta","mr","gu","kn","ml","pa","or","as","ur"].includes(v)) return v as LocaleCode;`
);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed i18n context");

