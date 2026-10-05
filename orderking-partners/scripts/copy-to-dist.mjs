import fs from "node:fs";
import path from "node:path";

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

const appDir = process.cwd();
const cloudflareStatic = path.join(appDir, ".output/public");
const legacyVercelStatic = path.join(appDir, ".vercel/output/static");
const dest = path.join(appDir, "dist");

const source = fs.existsSync(cloudflareStatic)
  ? cloudflareStatic
  : fs.existsSync(legacyVercelStatic)
    ? legacyVercelStatic
    : null;

if (source) {
  console.log(`Copying ${source} to ${dest}`);
  copyDir(source, dest);
} else {
  console.log("No Nitro static output found; leaving existing dist output unchanged.");
}
