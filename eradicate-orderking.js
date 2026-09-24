const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\Users\\hasan\\OrderKing';

// Folders we definitely want to skip to avoid breaking git, node_modules, etc.
const IGNORE_DIRS = new Set([
  '.git', 
  'node_modules', 
  '.next', 
  '.vercel', 
  'dist', 
  'build', 
  '.svelte-kit', 
  'coverage', 
  '.gemini',
  'screenshots',
  '.vite'
]);

function replaceInFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return;
    
    // Only process text files by extension
    const ext = path.extname(filePath).toLowerCase();
    const validExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql', '.env', '.example', '.html', '.css', '.sh', '.cjs', '.mjs', ''];
    if (!validExts.includes(ext) && ext !== '') return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/ORDERKING/g, 'ORDERKING');
    content = content.replace(/OrderKing/g, 'OrderKing');
    content = content.replace(/orderking/g, 'orderking');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated content in: ${filePath}`);
    }
  } catch (err) {
    console.error(`Failed to process ${filePath}:`, err.message);
  }
}

function processDirectoryForContent(dirPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    if (IGNORE_DIRS.has(item)) continue;
    
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectoryForContent(fullPath);
    } else {
      replaceInFile(fullPath);
    }
  }
}

function renameDirectoriesAndFiles(dirPath) {
  // We read the directory first, process children, then rename ourselves (bottom-up)
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    if (IGNORE_DIRS.has(item)) continue;
    
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      renameDirectoriesAndFiles(fullPath);
    }
    
    // Now check if the item NAME contains orderking
    if (item.toLowerCase().includes('orderking')) {
      let newItem = item;
      newItem = newItem.replace(/ORDERKING/g, 'ORDERKING');
      newItem = newItem.replace(/OrderKing/g, 'OrderKing');
      newItem = newItem.replace(/orderking/g, 'orderking');
      
      const newFullPath = path.join(dirPath, newItem);
      try {
        fs.renameSync(fullPath, newFullPath);
        console.log(`Renamed: ${fullPath} -> ${newFullPath}`);
      } catch (err) {
        console.error(`Failed to rename ${fullPath}:`, err.message);
      }
    }
  }
}

console.log("Starting Zero OrderKing Eradication...");
console.log("Phase 1: Content Replacement");
processDirectoryForContent(ROOT_DIR);

console.log("\nPhase 2: File and Directory Renaming");
renameDirectoriesAndFiles(ROOT_DIR);

console.log("\nEradication Complete.");
