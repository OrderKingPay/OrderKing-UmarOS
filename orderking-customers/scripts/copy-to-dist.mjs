import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

function run(appDir) {
    const srcVercel = path.join(appDir, '.vercel/output/static');
    const srcNitro = path.join(appDir, '.output/public');
    const dest = path.join(appDir, 'dist');
    const destClient = path.join(appDir, 'dist/client');
    
    // Cloudflare Pages uses dist, so we must copy from the output directory
    if (fs.existsSync(srcNitro)) {
        console.log("Copying ${srcNitro} to ${dest}");
        copyDir(srcNitro, dest);
    } else if (fs.existsSync(srcVercel)) {
        console.log("Copying ${srcVercel} to ${destClient}");
        copyDir(srcVercel, destClient);
    }
}

const appDir = process.cwd();
run(appDir);
