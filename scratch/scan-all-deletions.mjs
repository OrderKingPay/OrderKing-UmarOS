import fs from 'fs';
import path from 'path';

const rootDir = 'C:/Users/hasan/OrderKing';

// 1. Check backup, patch, and temp files
const junkExtensions = ['.bak', '.patch', '.orig', '.tmp'];
const junkFiles = [];

function scanJunk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === '.git') continue;
      if (item.name === '.temp' || item.name === 'tmp') {
        junkFiles.push({ type: 'temp_dir', path: fullPath });
      } else {
        scanJunk(fullPath);
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (junkExtensions.includes(ext) || item.name.endsWith('.local.bak') || item.name.includes('copy') || item.name.endsWith('.log')) {
        junkFiles.push({ type: 'file', path: fullPath });
      }
    }
  }
}

scanJunk(rootDir);
console.log(`Found ${junkFiles.length} junk/backup/temp files or dirs:`);
console.log(junkFiles.slice(0, 30));

// 2. Scan for unreferenced directories in HDmaster/src/lib/orderking
const libOrderKing = path.join(rootDir, 'HDmaster/src/lib/orderking');
const deadOrderkingDirs = [];

if (fs.existsSync(libOrderKing)) {
  const routesDir = path.join(rootDir, 'HDmaster/src/routes');
  const componentsDir = path.join(rootDir, 'HDmaster/src/components');
  
  function getAllSrc(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'dist') {
          files = files.concat(getAllSrc(p));
        }
      } else if (['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(item.name))) {
        files.push(p);
      }
    }
    return files;
  }

  const allSrc = [...getAllSrc(routesDir), ...getAllSrc(componentsDir)];
  const allContent = allSrc.map(f => fs.readFileSync(f, 'utf8')).join('\n');

  const dirs = fs.readdirSync(libOrderKing, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const d of dirs) {
    const pattern = new RegExp(`['"]@/lib/orderking/${d}(/|['"])`, 'g');
    if (!allContent.match(pattern)) {
      deadOrderkingDirs.push(path.join(libOrderKing, d));
    }
  }
}

console.log(`\nFound ${deadOrderkingDirs.length} dead modules in HDmaster/src/lib/orderking.`);
console.log('Sample dead modules:', deadOrderkingDirs.slice(0, 15));
