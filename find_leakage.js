const fs = require('fs');
const path = require('path');

const keywords = /100x|supreme|perfection|forceful|realism|missile/i;
const excludeDirs = ['node_modules', '.git', 'dist', '.next', '.pnpm', '.temp'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!excludeDirs.some(ex => file.includes(ex))) {
        results = results.concat(walk(file));
      }
    } else {
      if (/\.(ts|tsx|md|json|js)$/.test(file)) {
        results.push(file);
      }
    }
  });
  return results;
}

const allFiles = walk('C:/Users/hasan/OrderKing');
let found = [];

for (const file of allFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (keywords.test(content)) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (keywords.test(line)) {
          found.push({ file, lineNum: index + 1, line: line.trim() });
        }
      });
    }
  } catch (e) {}
}

console.log(JSON.stringify(found, null, 2));
