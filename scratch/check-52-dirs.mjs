import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const libPath = path.resolve(cwd, 'HDmaster/src/lib/orderking');
const srcPath = path.resolve(cwd, 'HDmaster/src');

function getAllFiles(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(item.name)) {
        files = files.concat(getAllFiles(full));
      }
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(item.name))) {
      files.push(full);
    }
  }
  return files;
}

const allSrc = getAllFiles(srcPath);
const entries = fs.readdirSync(libPath, { withFileTypes: true });
const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

const used = [];
const unused = [];

for (const dirName of dirs) {
  const dirFullPath = path.join(libPath, dirName);
  // Files outside this directory
  const externalFiles = allSrc.filter(f => !f.startsWith(dirFullPath));
  
  let isImported = false;
  for (const f of externalFiles) {
    const content = fs.readFileSync(f, 'utf8');
    if (
      content.includes(`@/lib/orderking/${dirName}`) ||
      content.includes(`/lib/orderking/${dirName}`) ||
      content.includes(`'../${dirName}`) ||
      content.includes(`"../${dirName}`) ||
      content.includes(`'./${dirName}`) ||
      content.includes(`"../../${dirName}`)
    ) {
      isImported = true;
      break;
    }
  }
  
  if (isImported) {
    used.push(dirName);
  } else {
    unused.push(dirName);
  }
}

console.log('USED DIRECTORIES (' + used.length + '):', used);
console.log('\nUNUSED / DEAD DIRECTORIES (' + unused.length + '):', unused);
