const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules')) {
                processDir(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            content = content.replace(/<img\s([^>]+)>/gi, (match, p1) => {
                if (!p1.includes('loading=')) {
                    modified = true;
                    return '<img loading="lazy" ' + p1 + '>';
                }
                return match;
            });
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}

processDir('c:/Users/hasan/OrderKing/orderking-customers/src');
processDir('c:/Users/hasan/OrderKing/HDmaster/src');
