import fs from "node:fs";
import path from "node:path";

const appDir = process.cwd();
const distDir = path.join(appDir, "dist");

if (!fs.existsSync(distDir)) {
  throw new Error("Cloudflare Pages build output is missing: dist/");
}

console.log("[cloudflare] Using Vite/Nitro dist/ output directly; no legacy host copy step is required.");
