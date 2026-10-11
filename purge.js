const fs = require('fs');
const path = require('path');

const dirsToScan = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders'];
const ignoreDirs = ['node_modules', '.git', 'dist', '.next', 'build', '.turbo', 'coverage'];

const wordMap = {
    'Supreme': 'Premium',
    'Godfather': 'Executive',
    'God mode': 'Admin_Mode',
    '100x': 'High_Performance',
    'Missile': 'Targeted',
    'Carpet-Bombing': 'Broad_Reach',
    'Nuclear': 'Critical',
    'Fake': 'Simulated',
    'Mock': 'Simulated',
    'Super': 'Advanced',
    'UmarOS_Supreme_AI': 'UmarOS_AI_Terminal'
};

function getFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (ignoreDirs.includes(file)) continue;
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const allFiles = [];
dirsToScan.forEach(dir => getFiles(dir, allFiles));

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix imports by renaming references first
    for (const [oldW, newW] of Object.entries(wordMap)) {
        const regex = new RegExp(oldW, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, newW);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }

    // Rename file if needed
    const basename = path.basename(file);
    let newBasename = basename;
    for (const [oldW, newW] of Object.entries(wordMap)) {
        if (newBasename.includes(oldW)) {
            newBasename = newBasename.replace(new RegExp(oldW, 'g'), newW);
        }
    }

    if (basename !== newBasename) {
        const newFile = path.join(path.dirname(file), newBasename);
        fs.renameSync(file, newFile);
        console.log(`Renamed: ${file} -> ${newFile}`);
    }
});

console.log('Purge and rename complete.');

