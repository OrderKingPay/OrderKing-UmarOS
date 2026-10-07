const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.turbo')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
let removedCount = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('// @ts-nocheck')) {
    content = content.replace(/\/\/\s*@ts-nocheck\r?\n?/g, '');
    fs.writeFileSync(f, content, 'utf8');
    removedCount++;
    console.log('Removed from', f);
  }
}
console.log('Removed from ' + removedCount + ' files.');
