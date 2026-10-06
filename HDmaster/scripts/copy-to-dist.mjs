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
    const src = path.join(appDir, '.vercel/output/static');
    const dest = path.join(appDir, 'dist/client');
    if (fs.existsSync(src)) {
        console.log(`Copying ${src} to ${dest}`);
        copyDir(src, dest);
    }
}

const appDir = process.cwd();
run(appDir);
