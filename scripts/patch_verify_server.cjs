const fs = require("fs");
const path = require("path");

const p = path.resolve(__dirname, "../HDmaster/src/lib/auth/verify.server.ts");
let content = fs.readFileSync(p, "utf8");
const isCrlf = content.includes("\r\n");
content = content.replace(/\r\n/g, "\n");

const idx1 = content.indexOf("export async function getSessionUser(");
const endIdx1 = content.indexOf("try {", idx1);
const repl1 = "export async function getSessionUser(\n  bearerToken?: string,\n  requestOverride?: Request,\n): Promise<VerifiedUser | null> {\n  let request: Request | null = requestOverride || null;\n  ";
content = content.slice(0, idx1) + repl1 + content.slice(endIdx1);

const idx2 = content.indexOf("export async function requireUserId(");
const endIdx2 = content.indexOf("if (user) return user.id;", idx2);
const repl2 = "export async function requireUserId(\n  bearerToken?: string,\n  requestOverride?: Request,\n): Promise<string> {\n  const user = await getSessionUser(bearerToken, requestOverride);\n  ";
content = content.slice(0, idx2) + repl2 + content.slice(endIdx2);

fs.writeFileSync(p, isCrlf ? content.replace(/\n/g, "\r\n") : content, "utf8");
console.log("✅ Successfully patched verify.server.ts!");
