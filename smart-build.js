const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const siteName = process.env.SITE_NAME || '';
console.log('Detected SITE_NAME:', siteName);

let targetDir = '';

if (siteName.includes('riders')) {
    targetDir = 'orderking-riders';
} else if (siteName.includes('partners')) {
    targetDir = 'orderking-partners';
} else if (siteName.includes('hdmaster')) {
    targetDir = 'HDmaster';
} else if (siteName.includes('integration')) {
    targetDir = 'Apps-integration-';
} else {
    targetDir = 'orderking-customers'; // Default to customers
}

console.log('Automatically switching to directory:', targetDir);

if (!fs.existsSync(targetDir)) {
    console.error('Directory does not exist:', targetDir);
    process.exit(1);
}

try {
    console.log(`Running npm install in ${targetDir}...`);
    execSync('npm install', { cwd: path.join(process.cwd(), targetDir), stdio: 'inherit' });
    
    console.log(`Running build in ${targetDir}...`);
    execSync('npm run build', { cwd: path.join(process.cwd(), targetDir), stdio: 'inherit' });
    
    console.log('Copying build artifacts to root so Netlify can publish them...');
    fs.cpSync(path.join(targetDir, 'dist'), path.join(process.cwd(), 'dist'), { recursive: true });
    
    if (fs.existsSync(path.join(targetDir, '.netlify'))) {
        fs.cpSync(path.join(targetDir, '.netlify'), path.join(process.cwd(), '.netlify'), { recursive: true });
    }
    
    console.log('Auto-build completed successfully!');
} catch (e) {
    console.error('Auto-build failed:', e);
    process.exit(1);
}
