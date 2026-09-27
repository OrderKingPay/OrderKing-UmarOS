const fs = require('fs');

const files = [
    "C:/Users/hasan/OrderKing/Apps-integration-/vite.config.ts",
    "C:/Users/hasan/OrderKing/HDmaster/vite.config.ts",
    "C:/Users/hasan/OrderKing/orderking-customers/vite.config.ts",
    "C:/Users/hasan/OrderKing/orderking-partners/vite.config.ts",
    "C:/Users/hasan/OrderKing/orderking-riders/vite.config.ts"
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // We will just do string replacement
    const toRemove1 = `minify: 'esbuild',`;
    const toRemove2 = `esbuild: {
    drop: ['console', 'debugger'],
  },`;
    const toRemove3 = `esbuild: {
    drop: ['console', 'debugger']
  },`;
    
    // Fallback: replace everything between build: { and }
    content = content.replace(/minify:\s*'esbuild',\s*/g, '');
    content = content.replace(/esbuild:\s*\{\s*drop:\s*\[\s*'console',\s*'debugger'\s*\]\s*,?\s*\},?/g, '');

    fs.writeFileSync(file, content);
}
console.log("Done replacing esbuild configs");
