const fs = require('fs');
const path = require('path');

const dirsToScan = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders'];
const ignoreDirs = ['node_modules', '.git', 'dist', '.next', 'build', '.turbo', 'coverage'];

function getFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignoreDirs.includes(file)) continue;
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else {
            if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

const allFiles = [];
dirsToScan.forEach(dir => getFiles(dir, allFiles));

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('High_Performance')) {
        content = content.replace(/High_Performance/g, 'High_Performance');
        changed = true;
    }
    if (content.includes('Broad_Reach')) {
        content = content.replace(/Broad_Reach/g, 'Broad_Reach');
        changed = true;
    }
    if (content.includes('Admin_Mode')) {
        content = content.replace(/Admin_Mode/g, 'Admin_mode');
        changed = true;
    }
    if (content.includes('Admin_Mode')) {
        content = content.replace(/Admin_Mode/g, 'Admin_Mode');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
    }
});

