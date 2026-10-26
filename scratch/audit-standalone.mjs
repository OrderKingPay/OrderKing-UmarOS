import fs from 'node:fs';
import path from 'node:path';

const root = 'c:/Users/hasan/OrderKing';
const hdmasterSrc = path.join(root, 'HDmaster/src');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '.wrangler', '.tanstack'].includes(ent.name)) {
        res = res.concat(getAllFiles(p, exts));
      }
    } else if (exts.some(ext => ent.name.endsWith(ext))) {
      res.push(p);
    }
  }
  return res;
}

const allFiles = getAllFiles(hdmasterSrc);

function checkImports(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  const relPath = path.relative(hdmasterSrc, filePath).replace(/\\/g, '/');
  
  let importedBy = [];
  for (const file of allFiles) {
    if (file === filePath) continue;
    const content = fs.readFileSync(file, 'utf8');
    // check if imported
    if (
      content.includes(`/${baseName}'`) ||
      content.includes(`/${baseName}"`) ||
      content.includes(`/${baseName}`) ||
      content.includes(relPath)
    ) {
      importedBy.push(path.relative(hdmasterSrc, file).replace(/\\/g, '/'));
    }
  }
  return importedBy;
}

const standaloneFiles = fs.readdirSync(path.join(hdmasterSrc, 'lib/orderking'), { withFileTypes: true })
  .filter(f => !f.isDirectory())
  .map(f => f.name);

console.log('=== Standalone files in lib/orderking ===');
for (const f of standaloneFiles) {
  const p = path.join(hdmasterSrc, 'lib/orderking', f);
  const callers = checkImports(p);
  console.log(`${f.padEnd(30)}: imported by ${callers.length} files (${callers.slice(0, 3).join(', ')})`);
}
