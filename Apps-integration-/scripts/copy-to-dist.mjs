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
  const srcNitro = path.join(appDir, '.output/public');
  const dest = path.join(appDir, 'dist');
  
  // Cloudflare Pages uses dist, copy compiled assets from Nitro
  if (fs.existsSync(srcNitro)) {
    console.log(`Copying ${srcNitro} to ${dest}`);
    copyDir(srcNitro, dest);
  }

  // Also check if _worker.js exists in .output/server
  const srcWorker = path.join(appDir, '.output/server/_worker.js');
  if (fs.existsSync(srcWorker)) {
    const destWorker = path.join(dest, '_worker.js');
    console.log(`Copying ${srcWorker} to ${destWorker}`);
    fs.copyFileSync(srcWorker, destWorker);
  }

  // Ensure public directory assets are copied
  const srcPublic = path.join(appDir, 'public');
  if (fs.existsSync(srcPublic)) {
    console.log(`Copying public assets from ${srcPublic} to ${dest}`);
    copyDir(srcPublic, dest);
  }
}

const appDir = process.cwd();
run(appDir);
