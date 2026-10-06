import fs from 'fs';
import path from 'path';

function findFiles(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(findFiles(filePath, filter));
      }
    } else {
      if (file === filter) results.push(filePath);
    }
  }
  return results;
}

const files = findFiles('.', 'db.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/async function createPgliteSql\(\)[\s\S]*?let sqlPromise/g, 'let sqlPromise');
  content = content.replace(/export async function getPglite\(\)[\s\S]*?export function ensureDbReady/g, 'export function ensureDbReady');
  content = content.replace(/if \(typeof window === "undefined" && getDbSource\(\) === "pglite"\) \{[\s\S]*?\}\n/g, '');
  content = content.replace(/if \(typeof window === "undefined" && dbSource === "pglite"\) \{[\s\S]*?\}\n/g, '');
  
  // also replace @electric-sql/pglite if it exists anywhere else
  content = content.replace(/import.*?pglite.*?;\n/g, '');

  fs.writeFileSync(file, content);
  console.log('Cleaned', file);
}
