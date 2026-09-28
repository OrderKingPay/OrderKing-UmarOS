import fs from 'fs';
import path from 'path';

const src = path.resolve('.vercel/output/static');
const dest = path.resolve('dist/client');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

if (fs.existsSync(src)) {
  copyDir(src, dest);
  console.log('Copied .vercel/output/static to dist/client');
} else {
  console.log('No .vercel/output/static found.');
}
