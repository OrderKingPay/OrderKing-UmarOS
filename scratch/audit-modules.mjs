import fs from 'fs';
import path from 'path';

const hdmaster = 'C:/Users/hasan/OrderKing/HDmaster';
const libOrderKing = path.join(hdmaster, 'src/lib/orderking');
const routesDir = path.join(hdmaster, 'src/routes');
const componentsDir = path.join(hdmaster, 'src/components');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'dist') {
        files = files.concat(getAllFiles(p, exts));
      }
    } else if (exts.includes(path.extname(item.name))) {
      files.push(p);
    }
  }
  return files;
}

const routeFiles = getAllFiles(routesDir);
const componentFiles = getAllFiles(componentsDir);
const allSrcFiles = [...routeFiles, ...componentFiles];

const allSrcContent = allSrcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const modules = fs.readdirSync(libOrderKing, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const activeModules = [];
const deadModules = [];

for (const mod of modules) {
  const pattern = new RegExp(`['"]@/lib/orderking/${mod}(/|['"])`, 'g');
  const matches = (allSrcContent.match(pattern) || []).length;
  if (matches > 0) {
    activeModules.push({ name: mod, refs: matches });
  } else {
    deadModules.push(mod);
  }
}

console.log('=== ACTIVE / IMPORTED MODULES IN HDMASTER UI & ROUTES ===');
console.table(activeModules);

console.log('\n=== UNUSED / DEAD WEIGHT MODULES (0 IMPORTS IN ROUTES OR COMPONENTS) ===');
console.log(deadModules);
