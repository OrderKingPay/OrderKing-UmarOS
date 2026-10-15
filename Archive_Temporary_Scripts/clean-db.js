const fs = require('fs');
const glob = require('glob');

const files = glob.sync('**/src/lib/db.ts', { ignore: 'node_modules/**' });
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove createPgliteSql completely
  content = content.replace(/async function createPgliteSql\(\)[\s\S]*?let sqlPromise/g, 'let sqlPromise');
  
  // Remove getPglite completely
  content = content.replace(/export async function getPglite\(\)[\s\S]*?export function ensureDbReady/g, 'export function ensureDbReady');
  
  // Clean up globalBoot
  content = content.replace(/if \(typeof window === "undefined" && getDbSource\(\) === "pglite"\) \{[\s\S]*?\}\n/g, '');
  content = content.replace(/if \(typeof window === "undefined" && dbSource === "pglite"\) \{[\s\S]*?\}\n/g, '');

  fs.writeFileSync(file, content);
  console.log('Cleaned', file);
}
