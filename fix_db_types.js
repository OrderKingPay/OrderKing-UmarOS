const fs = require("fs");
const path = "Apps-integration-/src/lib/db.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /export function getDbSource\(\) \{ return '\''neon'\''; \}/,
  export function getDbSource(): "neon" | "pglite" { return "neon"; }
);

content = content.replace(
  /export const dbSource = '\''neon'\'';/,
  export const dbSource: "neon" | "pglite" = "neon";
);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed db types");
