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

const files = findFiles('.', 'server.ts');
for (const file of files) {
  if (!file.includes('auth')) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace getPglite import
  content = content.replace(/, getPglite /g, ' ');
  
  // Remove pgliteDialect import
  content = content.replace(/import \{ pgliteDialect \} from "\.\/pglite-dialect";\n/g, '');
  
  // Fix the database variable initialization
  content = content.replace(/let database;[\s\S]*?console\.error\("Auth DB Init Error:", err\);[\s\S]*?\n\}/, "let database = new Pool({ connectionString: databaseUrl });");

  fs.writeFileSync(file, content);
  console.log('Fixed auth server:', file);
}
