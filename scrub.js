const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('AIzaSyD')) {
                    console.log('Found in:', file);
                    const newContent = content.replace(/AIzaSyD[a-zA-Z0-9\-_]+/, 'import.meta.env.VITE_GOOGLE_MAPS_API_KEY');
                    fs.writeFileSync(file, newContent, 'utf8');
                    console.log('Replaced in:', file);
                }
            }
        }
    });
    return results;
}

walk('.');
