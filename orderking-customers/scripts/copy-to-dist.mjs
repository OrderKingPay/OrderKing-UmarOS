import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
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
  const srcVercel = path.join(appDir, '.vercel/output/static');
  const dest = path.join(appDir, 'dist');
  const destClient = path.join(appDir, 'dist/client');

  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(destClient, { recursive: true });

  // 1. Copy compiled client assets from Nitro (.output/public)
  if (fs.existsSync(srcNitro)) {
    console.log(`Copying ${srcNitro} to ${dest}`);
    copyDir(srcNitro, dest);
    copyDir(srcNitro, destClient);
  }

  // 2. Copy compiled static assets from Vercel (.vercel/output/static)
  if (fs.existsSync(srcVercel)) {
    console.log(`Copying ${srcVercel} to ${destClient}`);
    copyDir(srcVercel, destClient);
    copyDir(srcVercel, dest);
  }

  // 3. Ensure Cloudflare Pages worker exists in dist
  const srcWorker = path.join(appDir, '.output/server/_worker.js');
  if (fs.existsSync(srcWorker)) {
    const destWorker = path.join(dest, '_worker.js');
    if (fs.statSync(srcWorker).isDirectory()) {
      copyDir(srcWorker, destWorker);
    } else {
      fs.copyFileSync(srcWorker, destWorker);
    }
  }

  // 4. Copy all static public assets (manifest, sw, icons, food, brand, edge configs)
  const srcPublic = path.join(appDir, 'public');
  if (fs.existsSync(srcPublic)) {
    console.log(`Copying public assets from ${srcPublic} to dist`);
    copyDir(srcPublic, dest);
    copyDir(srcPublic, destClient);
  }

  // 5. Guarantee edge configuration files are present in dist and dist/client
  for (const config of ['_headers', '_routes.json', '_redirects']) {
    const pubFile = path.join(srcPublic, config);
    if (fs.existsSync(pubFile)) {
      fs.copyFileSync(pubFile, path.join(dest, config));
      fs.copyFileSync(pubFile, path.join(destClient, config));
    }
  }
}

const appDir = process.cwd();
run(appDir);
