import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

function walkDir(dir, callback) {
  if (!existsSync(dir)) return;
  readdirSync(dir).forEach(f => {
    let dirPath = join(dir, f);
    let isDirectory = statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const workerDir = join(process.cwd(), 'dist/_worker.js');
if (existsSync(workerDir)) {
  walkDir(workerDir, (fp) => {
    if (!fp.endsWith('.js') && !fp.endsWith('.mjs')) return;
    
    let code = readFileSync(fp, 'utf-8');
    let changed = false;
    
    const regex = /import\s+([\w$]+|\{[^}]+\}|\*\s+as\s+[\w$]+)\s+from\s+["']node:([a-z_]+(?:\/[a-z_]+)?)["'];?\n?/g;
    if (regex.test(code)) {
      code = code.replace(regex, (match, imports, moduleName) => {
        if (imports.includes('* as ')) {
          return `const ${imports.replace('* as ', '')} = await import("node:${moduleName}");\n`;
        } else if (imports.includes('{')) {
          let destructure = imports.replace(/\bas\b/g, ':');
          return `const ${destructure} = await import("node:${moduleName}");\n`;
        } else {
          return `const {default: ${imports}} = await import("node:${moduleName}");\n`;
        }
      });
      changed = true;
    }

    if (changed) { writeFileSync(fp, code); console.log('Patched: ' + fp); }
  });
}
