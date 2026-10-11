const fs = require('fs');
const path = require('path');

const dirs = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders'];
const pattern = /(TODO|lorem|mockData|mock)/i;
const excludeDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.netlify', '.vercel', '.output']);
let results = [];

function searchDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!excludeDirs.has(entry.name)) {
                searchDir(path.join(dirPath, entry.name));
            }
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            const filePath = path.join(dirPath, entry.name);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (pattern.test(lines[i])) {
                        results.push(`${filePath}:${i + 1}:${lines[i].trim()}`);
                    }
                }
            } catch (e) {}
        }
    }
}

dirs.forEach(searchDir);
fs.writeFileSync('search_results2.txt', results.join('\n'), 'utf8');
