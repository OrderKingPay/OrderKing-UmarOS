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

const allAppFiles = getAllFiles(hdmasterSrc);

// Check references
function countRefs(needle) {
  let count = 0;
  const matchedIn = [];
  for (const file of allAppFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(needle)) {
      count++;
      matchedIn.push(path.relative(hdmasterSrc, file));
    }
  }
  return { count, matchedIn };
}

console.log('=== Checking directories in HDmaster/src/lib/orderking ===');
const orderkingLib = path.join(hdmasterSrc, 'lib/orderking');
const libDirs = fs.readdirSync(orderkingLib, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const dir of libDirs) {
  // Check how many files outside of lib/orderking/${dir} reference this dir
  let refsOutside = 0;
  const outsideMatches = [];
  for (const file of allAppFiles) {
    const rel = path.relative(hdmasterSrc, file).replace(/\\/g, '/');
    if (rel.startsWith(`lib/orderking/${dir}/`)) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (
      content.includes(`orderking/${dir}`) ||
      content.includes(`/${dir}/`) ||
      content.includes(`/${dir}'`) ||
      content.includes(`/${dir}"`)
    ) {
      refsOutside++;
      outsideMatches.push(rel);
    }
  }
  console.log(`DIR: ${dir.padEnd(20)} | Outside refs: ${refsOutside} | Examples: ${outsideMatches.slice(0, 3).join(', ')}`);
}

console.log('\n=== Checking HDmaster/src/components folders ===');
const compDir = path.join(hdmasterSrc, 'components');
const compDirs = fs.readdirSync(compDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const dir of compDirs) {
  let refsOutside = 0;
  const outsideMatches = [];
  for (const file of allAppFiles) {
    const rel = path.relative(hdmasterSrc, file).replace(/\\/g, '/');
    if (rel.startsWith(`components/${dir}/`)) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(`components/${dir}`) || content.includes(`/${dir}/`)) {
      refsOutside++;
      outsideMatches.push(rel);
    }
  }
  console.log(`COMP: ${dir.padEnd(20)} | Outside refs: ${refsOutside} | Examples: ${outsideMatches.slice(0, 3).join(', ')}`);
}
